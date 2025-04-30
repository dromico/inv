import { format } from "date-fns"
import { createServerComponentClient } from "@/lib/supabase-server"
import { Invoice } from "@/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText } from "lucide-react"

// Format currency as Malaysian Ringgit
function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2
  }).format(amount)
}

// Format date to a readable format
function formatDate(dateString: string) {
  return format(new Date(dateString), "PPP")
}

export default async function SubcontractorInvoicesPage() {
  const supabase = createServerComponentClient()
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">
              View and manage your invoices
            </p>
          </div>
        </div>
        
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">You must be logged in to view your invoices</p>
        </div>
      </div>
    )
  }
  
  // Fetch invoices for the current user
  // We need to join with jobs to get the subcontractor_id
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select(`
      *,
      job:jobs(subcontractor_id)
    `)
    .eq('job.subcontractor_id', user.id)
    .order('issued_date', { ascending: false })
  
  // Handle loading state with skeleton UI
  if (!invoices && !error) {
    return <InvoicesLoadingSkeleton />
  }
  
  // Handle error state
  if (error) {
    console.error('Error loading invoices:', error)
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
            <p className="text-muted-foreground">
              View and manage your invoices
            </p>
          </div>
        </div>
        
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground mb-4">Failed to load invoices. Please try again later.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            View and manage your invoices
          </p>
        </div>
        <div className="w-full md:w-[180px]">
          <Select defaultValue="all">
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
      </div>
      
      <div className="rounded-md border">
        {invoices && invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice: Invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>{formatDate(invoice.issued_date)}</TableCell>
                  <TableCell>{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                      invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {invoice.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <FileText className="mr-2 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">You don&apos;t have any invoices yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading skeleton component
function InvoicesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            View and manage your invoices
          </p>
        </div>
        <Skeleton className="h-10 w-[180px]" />
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