"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { Invoice, JobWithSubcontractor } from "@/types"
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
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Download,
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

// Extended Invoice type with job and profile information
interface InvoiceWithDetails extends Invoice {
  job: JobWithSubcontractor;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [subcontractorFilter, setSubcontractorFilter] = useState<string>("all")
  const [subcontractors, setSubcontractors] = useState<{id: string, company_name: string}[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null)
  const invoicesPerPage = 10
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadInvoices()
    loadSubcontractors()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, subcontractorFilter])

  const loadSubcontractors = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_name')
        .eq('role', 'subcontractor')
      
      if (error) throw error
      
      if (data) {
        setSubcontractors(data)
      }
    } catch (error) {
      console.error('Error loading subcontractors:', error)
    }
  }

  const loadInvoices = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          job:jobs(
            *,
            profile:profiles(*)
          )
        `, { count: 'exact' })
        .order('issued_date', { ascending: false })
      
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter)
      }
      
      if (subcontractorFilter !== "all") {
        query = query.eq('job.subcontractor_id', subcontractorFilter)
      }
      
      if (searchQuery) {
        query = query.or(`invoice_number.ilike.%${searchQuery}%`)
      }
      
      // Add pagination
      const from = (currentPage - 1) * invoicesPerPage
      const to = from + invoicesPerPage - 1
      
      const { data, error, count } = await query
        .range(from, to)
      
      if (error) {
        throw error
      }
      
      if (data) {
        setInvoices(data as unknown as InvoiceWithDetails[])
        setTotalInvoices(count || 0)
      }
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast({
        variant: "destructive",
        title: "Failed to load invoices",
        description: "There was a problem loading the invoices. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', invoiceId)
      
      if (error) {
        throw error
      }
      
      toast({
        title: "Status updated",
        description: `Invoice status updated to ${status}`,
      })
      
      loadInvoices()
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: "There was a problem updating the invoice status. Please try again.",
      })
    }
  }

  const totalPages = Math.ceil(totalInvoices / invoicesPerPage)

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
    loadInvoices()
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setCurrentPage(1) // Reset to first page
  }

  const handleSubcontractorFilterChange = (value: string) => {
    setSubcontractorFilter(value)
    setCurrentPage(1) // Reset to first page
  }

  const handleViewDetails = (invoice: InvoiceWithDetails) => {
    setSelectedInvoice(invoice)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manage Invoices</h2>
        <p className="text-muted-foreground">
          View and manage all subcontractor invoices
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="search"
              placeholder="Search invoice number..."
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
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-[220px]">
          <Select
            value={subcontractorFilter}
            onValueChange={handleSubcontractorFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by subcontractor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subcontractors</SelectItem>
              {subcontractors.map((subcontractor) => (
                <SelectItem key={subcontractor.id} value={subcontractor.id}>
                  {subcontractor.company_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="rounded-md border">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Loading invoices...</p>
          </div>
        ) : invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Subcontractor</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount (RM)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{invoice.job?.profile?.company_name}</TableCell>
                  <TableCell>{formatDate(invoice.issued_date)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {invoice.status}
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
                        <DropdownMenuItem onClick={() => handleViewDetails(invoice)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                        <DropdownMenuItem 
                          disabled={invoice.status === 'unpaid'}
                          onClick={() => updateInvoiceStatus(invoice.id, 'unpaid')}
                        >
                          <Clock className="mr-2 h-4 w-4 text-amber-500" />
                          Mark as Unpaid
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          disabled={invoice.status === 'paid'}
                          onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                        >
                          <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                          Mark as Paid
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          disabled={invoice.status === 'overdue'}
                          onClick={() => updateInvoiceStatus(invoice.id, 'overdue')}
                        >
                          <XCircle className="mr-2 h-4 w-4 text-red-500" />
                          Mark as Overdue
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/invoices/${invoice.id}`}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
                          </Link>
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
            <p className="text-muted-foreground mb-4">No invoices found</p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * invoicesPerPage) + 1} to {Math.min(currentPage * invoicesPerPage, totalInvoices)} of {totalInvoices} invoices
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
              <span className="sr-only">First page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous page</span>
            </Button>
            <div className="flex items-center gap-1">
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
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next page</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
              <span className="sr-only">Last page</span>
            </Button>
          </div>
        </div>
      )}
      
      {/* Invoice details dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Detailed information about the selected invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Invoice #:</div>
                <div className="col-span-3">{selectedInvoice.invoice_number}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Subcontractor:</div>
                <div className="col-span-3">{selectedInvoice.job?.profile?.company_name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Job Type:</div>
                <div className="col-span-3">{selectedInvoice.job?.job_type}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Location:</div>
                <div className="col-span-3">{selectedInvoice.job?.location}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Issued Date:</div>
                <div className="col-span-3">{formatDate(selectedInvoice.issued_date)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Due Date:</div>
                <div className="col-span-3">{formatDate(selectedInvoice.due_date)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Amount:</div>
                <div className="col-span-3 font-bold">{formatCurrency(selectedInvoice.amount)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Status:</div>
                <div className="col-span-3">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    selectedInvoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    selectedInvoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedInvoice.status}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Created:</div>
                <div className="col-span-3">{new Date(selectedInvoice.created_at).toLocaleString()}</div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex gap-2 justify-between w-full">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      updateInvoiceStatus(selectedInvoice.id, 'paid');
                      setSelectedInvoice(null);
                    }}
                    disabled={selectedInvoice.status === 'paid'}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                  </Button>
                </div>
                <div>
                  <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}