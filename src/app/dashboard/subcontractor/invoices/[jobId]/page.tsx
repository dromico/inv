"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatCurrency } from "@/lib/utils"
import { AlertCircle, ArrowLeft, Download, FileText, Loader2 } from "lucide-react"
import { PDFLoading, PDFButtonLoading } from "@/components/pdf-loading"

interface InvoicePageProps {
  params: {
    jobId: string
  }
}

interface Job {
  id: string
  job_type: string
  location: string
  start_date: string | null
  end_date: string | null
  status: string
  line_items: any[]
  notes: string | null
  subcontractor_id: string
}

interface Invoice {
  id: string
  job_id: string
  invoice_date: string
  status: string
  total_amount: number
}

export default function InvoiceDetailPage({ params }: InvoicePageProps) {
  const { jobId } = params
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<Job | null>(null)
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        
        // Check authentication
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to view invoice details.",
          })
          router.push('/auth/login')
          return
        }
        
        // Fetch job data
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .eq('subcontractor_id', user.id)
          .single()
          
        if (jobError) {
          throw jobError
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
        
        setJob(jobData)
        
        // Fetch invoice data
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('job_id', jobId)
          .maybeSingle()
          
        if (invoiceError) {
          console.error("Error fetching invoice:", invoiceError)
        } else if (invoiceData) {
          setInvoice(invoiceData)
        }
      } catch (error: any) {
        console.error("Error fetching data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to load invoice details",
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [jobId, router, supabase, toast])
  
  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true)
      
      // Open in a new tab
      window.open(`/api/invoices/${jobId}`, '_blank')
      
      // Wait a moment before resetting the state to show the loading animation
      setTimeout(() => {
        setIsGeneratingPDF(false)
      }, 1000)
    } catch (error) {
      console.error("Error generating PDF:", error)
      setIsGeneratingPDF(false)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
      })
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">Loading invoice details...</p>
      </div>
    )
  }
  
  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <h2 className="text-xl font-semibold mt-2">Invoice Not Found</h2>
        <p className="text-muted-foreground">The invoice you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-4" asChild>
          <Link href="/dashboard/subcontractor/invoices">Back to Invoices</Link>
        </Button>
      </div>
    )
  }
  
  // Calculate total from line items
  const calculateTotal = () => {
    if (!job.line_items || !Array.isArray(job.line_items)) return 0
    
    return job.line_items.reduce((sum, item) => {
      const quantity = item.unit_quantity || item.quantity || 0
      const price = item.unit_price || 0
      return sum + (quantity * price)
    }, 0)
  }
  
  const totalAmount = invoice?.total_amount || calculateTotal()
  
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Invoice Details</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            View and download invoice for your job
          </p>
        </div>
      </div>
      
      {isGeneratingPDF && <PDFLoading fullPage />}
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Job Type</h3>
              <p>{job.job_type}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Location</h3>
              <p>{job.location}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">Start Date</h3>
                <p>{formatDate(job.start_date)}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-1">End Date</h3>
                <p>{formatDate(job.end_date)}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Status</h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                job.status === 'completed' ? 'bg-green-100 text-green-800' :
                job.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-800'
              }`}>
                {job.status}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Invoice Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Invoice Date</h3>
              <p>{invoice ? formatDate(invoice.invoice_date) : 'Not yet generated'}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Total Amount</h3>
              <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
            </div>
            
            <div className="pt-4">
              <Button 
                className="w-full" 
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <PDFButtonLoading />
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Invoice PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Invoice ID: {invoice?.id || 'Not yet generated'}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
