"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs" // Correct import for client components
import { Database, Json } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PDFButtonLoading } from "@/components/pdf-loading"
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
  AlertCircle, // For 'overdue' status
  FileText, // For 'unpaid' status
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

// Define types based on the actual database schema
type ProfileRecord = Database['public']['Tables']['profiles']['Row']

// Custom interface for the invoice data from the database
interface InvoiceRecord {
  id: string;
  job_id: string;
  invoice_number: string;
  issued_date: string;
  due_date: string;
  amount: number;
  status: string; // 'unpaid', 'paid', 'overdue'
  created_at: string | null;
  updated_at: string | null;
}

// Simplified and corrected type for the joined data
interface InvoiceWithDetails extends InvoiceRecord {
  jobs: {
    id: string;
    job_type: string | null;
    location: string | null;
    line_items: Json[] | null;
    status: string; // 'pending', 'in-progress', 'completed'
    profiles: Pick<ProfileRecord, 'id' | 'company_name'> | null;
  } | null;
}

// Type for subcontractors list
type SubcontractorInfo = Pick<ProfileRecord, 'id' | 'company_name'> // Remove non-existent full_name field

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all") // 'generated', 'sent', 'paid'
  const [subcontractorFilter, setSubcontractorFilter] = useState<string>("all")
  const [subcontractors, setSubcontractors] = useState<SubcontractorInfo[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalInvoices, setTotalInvoices] = useState(0)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithDetails | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null)
  const invoicesPerPage = 10

  const { toast } = useToast()
  // Initialize client with proper Database type
  const supabase = createClientComponentClient<Database>()
  const loadSubcontractors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, company_name') // Remove non-existent full_name field
        .eq('role', 'subcontractor')
        .order('company_name');

      if (error) throw error;

      if (data) {
        setSubcontractors(data as SubcontractorInfo[]); // Cast to defined type
      }
    } catch (error) {
      console.error('Error loading subcontractors:', error);
      toast({
        variant: "destructive",
        title: "Failed to load subcontractors",
      });
    }
  }, [supabase, toast]);

  const loadInvoices = useCallback(async () => {
    try {
      setLoading(true);

      // Build the base query - only show invoices for completed jobs
      let query = supabase
        .from('invoices')
        .select(`
          *,
          jobs (
            id,
            job_type,
            location,
            line_items,
            status,
            profiles:subcontractor_id ( id, company_name )
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        // Filter to only show invoices for completed jobs
        .eq('jobs.status', 'completed');

      // Apply status filter if selected
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      // Apply subcontractor filter if selected
      if (subcontractorFilter !== "all") {
        // We need to filter on the jobs.subcontractor_id field
        query = query.eq('jobs.subcontractor_id', subcontractorFilter);
      }

      // Apply search filter if provided
      if (searchQuery) {
        // Use separate filters for each condition
        // Note: We can't directly filter on foreign tables in the OR clause
        // So we'll use a simpler approach for now
        query = query.or('id.neq.no_match'); // This creates a dummy condition that's always true

        // We'll handle the search filtering in JavaScript after fetching the data
        // This is a workaround for the limitations of the Supabase query API
      }

      // Add pagination
      const from = (currentPage - 1) * invoicesPerPage;
      const to = from + invoicesPerPage - 1;

      // Execute the query
      const { data, error, count } = await query.range(from, to);

      if (error) {
        console.error('Supabase query error:', JSON.stringify(error));
        throw new Error(`Supabase query error: ${error.message || JSON.stringify(error)}`);
      }

      if (data) {
        // Apply client-side filtering for search if needed
        let filteredData = data;

        if (searchQuery && data.length > 0) {
          const searchLower = searchQuery.toLowerCase();
          filteredData = data.filter(invoice => {
            // Check job_type (with null/undefined handling)
            const jobTypeMatch = invoice.jobs?.job_type
              ? invoice.jobs.job_type.toLowerCase().includes(searchLower)
              : false;

            // Check company_name (with null/undefined handling)
            const companyMatch = invoice.jobs?.profiles?.company_name
              ? invoice.jobs.profiles.company_name.toLowerCase().includes(searchLower)
              : false;

            // Return true if either matches
            return jobTypeMatch || companyMatch;
          });
        }

        // Convert the data to match our expected type
        setInvoices(filteredData as unknown as InvoiceWithDetails[]);

        // If we're doing client-side filtering, we need to adjust the total count
        if (searchQuery) {
          setTotalInvoices(filteredData.length);
        } else {
          setTotalInvoices(count || 0);
        }
      } else {
        setInvoices([]);
        setTotalInvoices(0);
      }
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      toast({
        variant: "destructive",
        title: "Failed to load invoices",
        description: error.message || "There was a problem loading the invoices. Please try again.",
      });
      setInvoices([]); // Clear invoices on error
      setTotalInvoices(0);
    } finally {
      setLoading(false);
    }
  }, [supabase, toast, currentPage, statusFilter, subcontractorFilter, searchQuery, invoicesPerPage]);


  useEffect(() => {
    loadInvoices();
    loadSubcontractors();
  }, [loadInvoices, loadSubcontractors]); // Depend on the callback functions

  const updateInvoiceStatus = async (invoiceId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: status, updated_at: new Date().toISOString() }) // Also update updated_at
        .eq('id', invoiceId);

      if (error) {
        throw error;
      }

      toast({
        title: "Status updated",
        description: `Invoice status updated to ${status}`,
      });

      loadInvoices(); // Reload invoices to reflect the change
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        variant: "destructive",
        title: "Failed to update status",
        description: "There was a problem updating the invoice status. Please try again.",
      });
    }
  };

  const totalPages = Math.ceil(totalInvoices / invoicesPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1) page = 1;
    if (page > totalPages && totalPages > 0) page = totalPages; // Ensure page doesn't exceed total if > 0
    if (page !== currentPage) {
        setCurrentPage(page);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-MY', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Trigger search on submit or potentially on input change with debounce
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    loadInvoices(); // Trigger reload
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page
    // No need to call loadInvoices here, useEffect dependency array handles it
  };

  const handleSubcontractorFilterChange = (value: string) => {
    setSubcontractorFilter(value);
    setCurrentPage(1); // Reset to first page
    // No need to call loadInvoices here, useEffect dependency array handles it
  };

  const handleViewDetails = (invoice: InvoiceWithDetails) => {
    setSelectedInvoice(invoice);
  };

  // Helper to get status icon and color
  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle, color: 'text-green-800', bg: 'bg-green-100' };
      case 'overdue':
        return { icon: AlertCircle, color: 'text-red-800', bg: 'bg-red-100' };
      case 'unpaid':
      default:
        return { icon: FileText, color: 'text-amber-800', bg: 'bg-amber-100' };
    }
  };


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Completed Job Invoices</h2>
        <p className="text-muted-foreground">
          View and manage invoices for completed subcontractor jobs
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="search"
              placeholder="Search job or subcontractor..."
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
              <SelectItem value="all">All Subcontractors</SelectItem>              {subcontractors.map((subcontractor) => (
                <SelectItem key={subcontractor.id} value={subcontractor.id}>
                  {subcontractor.company_name || 'N/A'}
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
          <>
            {/* Mobile card view */}
            <div className="md:hidden">
              <div className="space-y-4 p-4">
                {invoices.map((invoice) => {
                  const statusStyle = getStatusStyle(invoice.status);
                  return (
                    <div key={invoice.id} className="rounded-lg border shadow-sm p-4 space-y-3 bg-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-base">{formatDate(invoice.created_at)}</h3>
                          <p className="text-xs text-muted-foreground">Invoice #{invoice.invoice_number}</p>
                        </div>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                          <statusStyle.icon className="mr-1 h-3 w-3" />
                          {invoice.status || 'N/A'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Subcontractor</p>
                          <p className="truncate font-medium">{invoice.jobs?.profiles?.company_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Job Type</p>
                          <p className="truncate font-medium">{invoice.jobs?.job_type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Amount</p>
                          <p className="font-medium text-base">{formatCurrency(invoice.amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Due Date</p>
                          <p className="font-medium">{formatDate(invoice.due_date)}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t mt-2">
                        <div className="text-xs text-muted-foreground">
                          Job Status: <span className="font-medium">{invoice.jobs?.status}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleViewDetails(invoice)}>
                            Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsGeneratingPDF(invoice.job_id);
                              window.open(`/api/admin/invoices/${invoice.job_id}`, '_blank');
                              setTimeout(() => setIsGeneratingPDF(null), 1000);
                            }}
                            disabled={isGeneratingPDF === invoice.job_id}
                          >
                            {isGeneratingPDF === invoice.job_id ? (
                              <PDFButtonLoading />
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" /> PDF
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Amount (RM)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusStyle = getStatusStyle(invoice.status);
                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{formatDate(invoice.created_at)}</TableCell>
                        <TableCell>{invoice.jobs?.profiles?.company_name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{invoice.jobs?.job_type || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">
                              Job Status: {invoice.jobs?.status}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(invoice.due_date)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                            <statusStyle.icon className="mr-1 h-3 w-3" />
                            {invoice.status || 'N/A'}
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
                                <FileText className="mr-2 h-4 w-4 text-amber-500" />
                                Mark as Unpaid
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={invoice.status === 'overdue'}
                                onClick={() => updateInvoiceStatus(invoice.id, 'overdue')}
                              >
                                <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                                Mark as Overdue
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={invoice.status === 'paid'}
                                onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setIsGeneratingPDF(invoice.job_id);
                                  window.open(`/api/admin/invoices/${invoice.job_id}`, '_blank');
                                  setTimeout(() => setIsGeneratingPDF(null), 1000);
                                }}
                                disabled={isGeneratingPDF === invoice.job_id}
                              >
                                {isGeneratingPDF === invoice.job_id ? (
                                  <PDFButtonLoading />
                                ) : (
                                  <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No invoices found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {Math.min(((currentPage - 1) * invoicesPerPage) + 1, totalInvoices)} to {Math.min(currentPage * invoicesPerPage, totalInvoices)} of {totalInvoices} invoices
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
            {/* Simple page number display */}
            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
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

      {/* Invoice details dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Invoice #{selectedInvoice.invoice_number}</span>
                <div className="inline-flex items-center">
                  {(() => {
                    const statusStyle = getStatusStyle(selectedInvoice.status);
                    return (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                        <statusStyle.icon className="mr-2 h-4 w-4" />
                        {selectedInvoice.status || 'N/A'}
                      </div>
                    );
                  })()}
                </div>
              </DialogTitle>
              <DialogDescription>
                Invoice created on {formatDate(selectedInvoice.created_at)} for completed job
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              {/* Invoice Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Invoice Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Number</p>
                    <p className="font-medium">{selectedInvoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Invoice Date</p>
                    <p className="font-medium">{formatDate(selectedInvoice.issued_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(selectedInvoice.due_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Amount</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedInvoice.amount)}</p>
                  </div>
                </div>
              </div>

              {/* Job Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Job Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Job Type</p>
                    <p className="font-medium">{selectedInvoice.jobs?.job_type || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job Status</p>
                    <p className="font-medium">{selectedInvoice.jobs?.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedInvoice.jobs?.location || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subcontractor</p>
                    <p className="font-medium">{selectedInvoice.jobs?.profiles?.company_name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* System Information Section */}
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Invoice ID:</span>
                  <span className="font-mono">{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Job ID:</span>
                  <span className="font-mono">{selectedInvoice.job_id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span>{formatDate(selectedInvoice.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Updated:</span>
                  <span>{formatDate(selectedInvoice.updated_at)}</span>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="col-span-4 mt-4">
                <div className="font-medium mb-2">Line Items:</div>
                {selectedInvoice.jobs?.line_items && Array.isArray(selectedInvoice.jobs.line_items) && selectedInvoice.jobs.line_items.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>                      <TableBody>
                        {selectedInvoice.jobs.line_items.map((item, index) => {
                          // Handle both formats of line items
                          if (typeof item !== 'object' || item === null) {
                            return null; // Skip non-object items
                          }

                          const itemObj = item as { [key: string]: Json };
                          const description = String(itemObj.description || itemObj.item_name || 'N/A');
                          const quantity = Number(itemObj.quantity || itemObj.unit_quantity || 0);
                          const unitPrice = Number(itemObj.unit_price || 0);
                          const total = quantity * unitPrice;
                            return (
                            <TableRow key={index}>
                              <TableCell>{String(description)}</TableCell>
                              <TableCell>{String(quantity)}</TableCell>
                              <TableCell>{formatCurrency(unitPrice)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No line items available</div>
                )}
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => updateInvoiceStatus(selectedInvoice.id, 'unpaid')}
                  disabled={selectedInvoice.status === 'unpaid'}
                >
                  <FileText className="mr-2 h-4 w-4 text-amber-500" />
                  Mark Unpaid
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => updateInvoiceStatus(selectedInvoice.id, 'overdue')}
                  disabled={selectedInvoice.status === 'overdue'}
                >
                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  Mark Overdue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => updateInvoiceStatus(selectedInvoice.id, 'paid')}
                  disabled={selectedInvoice.status === 'paid'}
                >
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Mark Paid
                </Button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button variant="outline" onClick={() => setSelectedInvoice(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsGeneratingPDF(selectedInvoice.job_id);
                    window.open(`/api/admin/invoices/${selectedInvoice.job_id}`, '_blank');
                    setTimeout(() => setIsGeneratingPDF(null), 1000);
                  }}
                  disabled={isGeneratingPDF === selectedInvoice.job_id}
                >
                  {isGeneratingPDF === selectedInvoice.job_id ? (
                    <PDFButtonLoading />
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}