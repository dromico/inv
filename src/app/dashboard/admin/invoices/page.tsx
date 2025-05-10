"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs" // Correct import for client components
import { Database, Json } from "@/types/database"
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
  Send, // For 'sent' status
  FileText, // For 'generated' status
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

// Define types based on the actual query structure
type InvoiceRecord = Database['public']['Tables']['invoices']['Row']
type JobRecord = Database['public']['Tables']['jobs']['Row']
type ProfileRecord = Database['public']['Tables']['profiles']['Row']

// Simplified and corrected type for the joined data
// Assuming 'jobs' might not have 'description' directly, let's use 'job_type' or fallback
interface InvoiceWithDetails extends InvoiceRecord {
  jobs: {
    id: string;
    job_type: string | null;
    location: string | null;
    line_items: Json[] | null;
  } | null; // Include line_items with proper Json type
  profiles: Pick<ProfileRecord, 'id' | 'company_name'> | null;
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

      // Build the base query
      let query = supabase
        .from('invoices')
        .select(`
          *,
          jobs ( id, job_type, location, line_items ),
          profiles:subcontractor_id ( id, company_name )
        `, { count: 'exact' })
        .order('invoice_date', { ascending: false });

      // Apply status filter if selected
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      // Apply subcontractor filter if selected
      if (subcontractorFilter !== "all") {
        query = query.eq('subcontractor_id', subcontractorFilter);
      }

      // Apply search filter if provided
      if (searchQuery) {
        // Create search pattern with wildcards
        const searchPattern = `%${searchQuery}%`;

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
            const companyMatch = invoice.profiles?.company_name
              ? invoice.profiles.company_name.toLowerCase().includes(searchLower)
              : false;

            // Return true if either matches
            return jobTypeMatch || companyMatch;
          });
        }

        // Ensure data matches the expected type
        setInvoices(filteredData as InvoiceWithDetails[]);

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
      case 'sent':
        return { icon: Send, color: 'text-blue-800', bg: 'bg-blue-100' };
      case 'generated':
      default:
        return { icon: FileText, color: 'text-amber-800', bg: 'bg-amber-100' };
    }
  };


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
              <SelectItem value="generated">Generated</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
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
                    <div key={invoice.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{formatDate(invoice.invoice_date)}</h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                          <statusStyle.icon className="mr-1 h-3 w-3" />
                          {invoice.status || 'N/A'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Subcontractor</p>
                          <p className="truncate">{invoice.profiles?.company_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Job Type</p>
                          <p className="truncate">{invoice.jobs?.job_type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(invoice)}>
                          Details
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/admin/invoices/${invoice.job_id}`}>
                            <Download className="h-4 w-4 mr-1" /> PDF
                          </Link>
                        </Button>
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
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Subcontractor</TableHead>
                    <TableHead>Job Type/Desc</TableHead>
                    <TableHead className="text-right">Amount (RM)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const statusStyle = getStatusStyle(invoice.status);
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{formatDate(invoice.invoice_date)}</TableCell>
                        <TableCell>{invoice.profiles?.company_name || 'N/A'}</TableCell>
                        {/* Display job_type or fallback */}
                        <TableCell>{invoice.jobs?.job_type || 'N/A'}</TableCell>
                        <TableCell className="text-right">{formatCurrency(invoice.total_amount)}</TableCell>
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
                                disabled={invoice.status === 'generated'}
                                onClick={() => updateInvoiceStatus(invoice.id, 'generated')}
                              >
                                <FileText className="mr-2 h-4 w-4 text-amber-500" />
                                Mark as Generated
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={invoice.status === 'sent'}
                                onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                              >
                                <Send className="mr-2 h-4 w-4 text-blue-500" />
                                Mark as Sent
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={invoice.status === 'paid'}
                                onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                {/* Link uses job_id from the invoice record */}
                                <Link href={`/dashboard/admin/invoices/${invoice.job_id}`}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </Link>
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
          <DialogContent className="max-w-[95vw] sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Invoice Details</DialogTitle>
              <DialogDescription>
                Detailed information for invoice generated on {formatDate(selectedInvoice.invoice_date)}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Invoice ID:</div>
                <div className="col-span-2 sm:col-span-3 text-xs text-muted-foreground break-all">{selectedInvoice.id}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Job ID:</div>
                <div className="col-span-2 sm:col-span-3 text-xs text-muted-foreground break-all">{selectedInvoice.job_id}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Subcontractor:</div>
                <div className="col-span-2 sm:col-span-3">{selectedInvoice.profiles?.company_name || 'N/A'}</div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-4">
                <div className="font-medium">Job Desc:</div>
                {/* Display job_type or fallback */}
                <div className="col-span-2 sm:col-span-3">{selectedInvoice.jobs?.job_type || 'N/A'}</div>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Job Location:</div>
                <div className="col-span-3">{selectedInvoice.jobs?.location || 'N/A'}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Invoice Date:</div>
                <div className="col-span-3">{formatDate(selectedInvoice.invoice_date)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Amount:</div>
                <div className="col-span-3 font-bold">{formatCurrency(selectedInvoice.total_amount)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Status:</div>
                <div className="col-span-3">
                   {(() => {
                       const statusStyle = getStatusStyle(selectedInvoice.status);
                       return (
                           <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>
                             <statusStyle.icon className="mr-1 h-3 w-3" />
                             {selectedInvoice.status || 'N/A'}
                           </div>
                       );
                   })()}
                </div>
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Created At:</div>
                <div className="col-span-3">{formatDate(selectedInvoice.created_at)}</div>
              </div>               <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-medium">Last Updated:</div>
                <div className="col-span-3">{formatDate(selectedInvoice.updated_at)}</div>
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
            <DialogFooter>
               <Button variant="outline" onClick={() => setSelectedInvoice(null)}>Close</Button>
               <Button asChild>
                 <Link href={`/dashboard/admin/invoices/${selectedInvoice.job_id}`}>
                   <Download className="mr-2 h-4 w-4" /> Download PDF
                 </Link>
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}