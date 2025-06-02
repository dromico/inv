"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Profile } from "@/types"
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
  MoreHorizontal,
  Search,
  UserCheck,
  UserX,
  Phone,
  Mail,
  MapPin,
  FileText,
  Trash2,
  Loader2,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Extended Profile type with job and invoice counts
interface ProfileWithStats extends Profile {
  job_count: number;
  completed_jobs: number;
  active_jobs: number;
  total_invoiced: number;
}

export default function AdminSubcontractorsPage() {
  const [subcontractors, setSubcontractors] = useState<ProfileWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalSubcontractors, setTotalSubcontractors] = useState(0)
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<ProfileWithStats | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "card">("table")
  const [deleteSubcontractor, setDeleteSubcontractor] = useState<ProfileWithStats | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const subcontractorsPerPage = 10

  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadSubcontractors()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter])

  const loadSubcontractors = async () => {
    try {
      setLoading(true)

      // First, get all subcontractor profiles
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'subcontractor')
        .order('company_name')

      if (searchQuery) {
        query = query.or(`company_name.ilike.%${searchQuery}%,contact_person.ilike.%${searchQuery}%`)
      }

      // Add pagination
      const from = (currentPage - 1) * subcontractorsPerPage
      const to = from + subcontractorsPerPage - 1

      const { data: profilesData, error: profilesError, count } = await query
        .range(from, to)

      if (profilesError) {
        throw profilesError
      }

      if (profilesData) {
        // For each subcontractor, get job and invoice stats
        const enhancedProfiles = await Promise.all(
          profilesData.map(async (profile) => {
            // Get job counts
            const { data: jobsData, error: jobsError } = await supabase
              .from('jobs')
              .select('id, status, total', { count: 'exact' })
              .eq('subcontractor_id', profile.id)

            if (jobsError) {
              console.error('Error fetching jobs:', jobsError)
              return {
                ...profile,
                job_count: 0,
                completed_jobs: 0,
                active_jobs: 0,
                total_invoiced: 0
              }
            }

            // Calculate job stats
            const job_count = jobsData?.length || 0
            const completed_jobs = jobsData?.filter(job => job.status === 'completed').length || 0
            const active_jobs = jobsData?.filter(job => job.status === 'in-progress').length || 0

            // Calculate total invoiced amount
            const total_invoiced = jobsData?.reduce((sum, job) => sum + (job.total || 0), 0) || 0

            return {
              ...profile,
              job_count,
              completed_jobs,
              active_jobs,
              total_invoiced
            }
          })
        )

        // Apply status filter if needed
        let filteredProfiles = enhancedProfiles
        if (statusFilter === "active") {
          filteredProfiles = enhancedProfiles.filter(profile => profile.active_jobs > 0)
        } else if (statusFilter === "inactive") {
          filteredProfiles = enhancedProfiles.filter(profile => profile.active_jobs === 0)
        }

        setSubcontractors(filteredProfiles)
        setTotalSubcontractors(count || 0)
      }
    } catch (error) {
      console.error('Error loading subcontractors:', error)
      toast({
        variant: "destructive",
        title: "Failed to load subcontractors",
        description: "There was a problem loading the subcontractors. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalSubcontractors / subcontractorsPerPage)

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
    loadSubcontractors()
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Reset to first page
  }

  const handleViewDetails = (subcontractor: ProfileWithStats) => {
    setSelectedSubcontractor(subcontractor)
  }

  const handleDeleteClick = (subcontractor: ProfileWithStats) => {
    setDeleteSubcontractor(subcontractor)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    try {
      if (!deleteSubcontractor) return

      setIsDeleting(true)

      console.log(`Attempting to delete subcontractor: ${deleteSubcontractor.company_name} (${deleteSubcontractor.id})`)

      const response = await fetch('/api/admin/subcontractors/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subcontractorId: deleteSubcontractor.id,
        }),
      })

      const result = await response.json()
      console.log('Delete API response:', result)

      if (!response.ok) {
        // Provide more specific error messages based on status code
        let errorMessage = result.message || 'Failed to delete subcontractor'

        if (response.status === 401) {
          errorMessage = 'Authentication required. Please log in again.'
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to delete subcontractors. Admin privileges required.'
        } else if (response.status === 404) {
          errorMessage = 'Subcontractor not found or has already been deleted.'
        } else if (response.status === 500) {
          errorMessage = `Server error: ${result.message}. ${result.note || ''}`
        }

        throw new Error(errorMessage)
      }

      toast({
        title: "Account deleted",
        description: result.message || "The subcontractor account has been deleted successfully.",
      })

      console.log(`Successfully deleted subcontractor: ${deleteSubcontractor.company_name}`)

      // Reload the subcontractors list
      loadSubcontractors()
    } catch (error) {
      console.error('Error deleting subcontractor:', error)
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete subcontractor. Please try again.",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setDeleteSubcontractor(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manage Subcontractors</h2>
        <p className="text-muted-foreground">
          View and manage all subcontractors in the system
        </p>
      </div>

      {/* Wrap filters, view switcher, and content in Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "card")}>
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between mb-4"> {/* Added mb-4 */}
          <div className="flex-1">
            <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center space-x-2">
              <Input
                type="search"
                placeholder="Search by name or contact person..."
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
          <div className="flex gap-4 items-center"> {/* Added items-center */}
            <div className="w-[180px]">
              <Select
                value={statusFilter}
                onValueChange={handleStatusFilterChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcontractors</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* TabsList is now a direct child of Tabs */}
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="card">Card View</TabsTrigger>
            </TabsList>
          </div> {/* Closes flex gap-4 */}
        </div> {/* Closes flex container for filters/search */}

        {/* TabsContent remains a direct child of Tabs */}
        <TabsContent value="table" className="mt-0">
        <div className="rounded-md border">
          {loading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Loading subcontractors...</p>
            </div>
          ) : subcontractors.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead className="text-right">Total Invoiced (RM)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subcontractors.map((subcontractor) => (
                  <TableRow key={subcontractor.id}>
                    <TableCell className="font-medium">{subcontractor.company_name}</TableCell>
                    <TableCell>{subcontractor.contact_person || "—"}</TableCell>
                    <TableCell>{subcontractor.phone_number || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{subcontractor.job_count} total</span>
                        <span className="text-xs text-muted-foreground">
                          ({subcontractor.active_jobs} active)
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(subcontractor.total_invoiced)}</TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subcontractor.active_jobs > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subcontractor.active_jobs > 0 ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => handleViewDetails(subcontractor)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <a href={`mailto:${subcontractor.contact_person}`}>
                              <Mail className="mr-2 h-4 w-4" />
                              Contact via Email
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`tel:${subcontractor.phone_number}`}>
                              <Phone className="mr-2 h-4 w-4" />
                              Contact via Phone
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(subcontractor)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No subcontractors found</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="card" className="mt-0">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading subcontractors...</p>
          </div>
        ) : subcontractors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subcontractors.map((subcontractor) => (
              <Card key={subcontractor.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle>{subcontractor.company_name}</CardTitle>
                  <CardDescription>
                    {subcontractor.contact_person || "No contact person"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{subcontractor.phone_number || "No phone number"}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="line-clamp-1">{subcontractor.address || "No address"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Jobs</p>
                      <p className="text-lg font-medium">{subcontractor.job_count}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Active Jobs</p>
                      <p className="text-lg font-medium">{subcontractor.active_jobs}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Completed Jobs</p>
                      <p className="text-lg font-medium">{subcontractor.completed_jobs}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Invoiced</p>
                      <p className="text-lg font-medium">{formatCurrency(subcontractor.total_invoiced)}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-3">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    subcontractor.active_jobs > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {subcontractor.active_jobs > 0 ? 'Active' : 'Inactive'}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(subcontractor)}>
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No subcontractors found</p>
          </div>
        )}
      </TabsContent>

      {/* Pagination - Now inside the Tabs component */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {((currentPage - 1) * subcontractorsPerPage) + 1} to {Math.min(currentPage * subcontractorsPerPage, totalSubcontractors)} of {totalSubcontractors} subcontractors
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
      {/* End Pagination */}

      </Tabs> {/* Closing the Tabs component started before the filters */}

      {/* Subcontractor details dialog - Outside the Tabs component */}
      {selectedSubcontractor && (
        <Dialog open={!!selectedSubcontractor} onOpenChange={() => setSelectedSubcontractor(null)}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Subcontractor Details</DialogTitle>
              <DialogDescription>
                Detailed information about {selectedSubcontractor.company_name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Company:</div>
                <div className="col-span-3">{selectedSubcontractor.company_name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Contact Person:</div>
                <div className="col-span-3">{selectedSubcontractor.contact_person || "—"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Phone:</div>
                <div className="col-span-3">{selectedSubcontractor.phone_number || "—"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Address:</div>
                <div className="col-span-3">{selectedSubcontractor.address || "—"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Registered:</div>
                <div className="col-span-3">{formatDate(selectedSubcontractor.created_at)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Status:</div>
                <div className="col-span-3">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedSubcontractor.active_jobs > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedSubcontractor.active_jobs > 0 ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-lg font-medium">{selectedSubcontractor.job_count}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-lg font-medium">{selectedSubcontractor.active_jobs}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  <p className="text-lg font-medium">{selectedSubcontractor.completed_jobs}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Invoiced</p>
                  <p className="text-lg font-medium">{formatCurrency(selectedSubcontractor.total_invoiced)}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubcontractor(null)}
                >
                  Close
                </Button>
                <Button asChild>
                  <a href={`/dashboard/admin/jobs?subcontractor=${selectedSubcontractor.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Jobs
                  </a>
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Subcontractor Account</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the subcontractor&apos;s account and all associated data, including their profile details, submitted information, job history, and any other related records.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {deleteSubcontractor && (
              <p className="text-sm font-medium text-destructive">
                Are you sure you want to delete {deleteSubcontractor.company_name}?
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeleteSubcontractor(null)
              }}
              disabled={isDeleting}
              className="min-w-[100px] min-h-[40px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="min-w-[100px] min-h-[40px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}