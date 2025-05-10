"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { jobSchema, lineItemSchema } from "@/lib/validations"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { AlertCircle, ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"

type FormValues = z.infer<typeof jobSchema>
type LineItem = z.infer<typeof lineItemSchema> & { total?: number }

interface EditJobPageProps {
  params: Promise<{
    jobId: string
  }>
}

export default function EditJobPage({ params }: EditJobPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const { jobId } = use(params)

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      location: "",
      start_date: new Date(),
      end_date: new Date(),
      line_items: [
        {
          item_name: "",
          unit_quantity: 1,
          unit_price: 0,
        }
      ],
      notes: "",
    },
  })

  // Setup field array for line items
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  })

  // Fetch job data
  useEffect(() => {
    async function fetchJob() {
      try {
        setIsLoading(true)
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to edit a job.",
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
          setError("Job not found or you don't have permission to edit it.")
          return
        }

        // Check if job status is 'pending'
        if (jobData.status !== 'pending') {
          setError("Only jobs with 'pending' status can be edited.")
          return
        }

        // Parse dates
        const startDate = new Date(jobData.start_date)
        const endDate = new Date(jobData.end_date)

        // Parse line items
        let lineItems = jobData.line_items || []

        // If line_items is empty or not an array, create a default line item from legacy fields
        if (!Array.isArray(lineItems) || lineItems.length === 0) {
          lineItems = [{
            item_name: jobData.job_type,
            unit_quantity: jobData.unit,
            unit_price: jobData.unit_price
          }]
        }

        // Set form values
        form.reset({
          location: jobData.location,
          start_date: startDate,
          end_date: endDate,
          line_items: lineItems,
          notes: jobData.notes || "",
        })
      } catch (error: any) {
        console.error('Error fetching job:', error)
        setError(`Failed to load job details: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()
  }, [jobId, router, supabase, toast, form])

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to update a job")
      }

      // Verify job is still pending
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('status')
        .eq('id', jobId)
        .eq('subcontractor_id', user.id)
        .single()

      if (jobError) {
        throw jobError
      }

      if (!jobData) {
        throw new Error("Job not found or you don't have permission to edit it")
      }

      if (jobData.status !== 'pending') {
        throw new Error("This job can no longer be edited as its status has changed")
      }

      // Calculate grand total from all line items
      const lineItemsWithTotals = data.line_items.map(item => ({
        ...item,
        total: item.unit_quantity * item.unit_price
      }))

      // Prepare data for update
      const updateData = {
        job_type: data.line_items[0].item_name, // Use first line item as main job type for backward compatibility
        location: data.location,
        start_date: format(data.start_date, "yyyy-MM-dd"),
        end_date: format(data.end_date, "yyyy-MM-dd"),
        unit: data.line_items[0].unit_quantity, // Use first line item for backward compatibility
        unit_price: data.line_items[0].unit_price, // Use first line item for backward compatibility
        notes: data.notes || null,
        // Store all line items as JSON for the new multi-item functionality
        line_items: lineItemsWithTotals,
        updated_at: new Date().toISOString()
      };

      // Update job in the database
      const { error } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .eq('subcontractor_id', user.id)
        .eq('status', 'pending'); // Extra safeguard to ensure only pending jobs are updated

      if (error) throw error

      toast({
        title: "Job Updated",
        description: "Your job has been updated successfully.",
      })

      // Redirect to job details page
      router.push(`/dashboard/subcontractor/jobs/${jobId}`)
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        variant: "destructive",
        title: "Failed to update job",
        description: `There was a problem: ${error?.message || 'An unexpected error occurred.'}`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate line item totals and grand total
  const lineItems = form.watch("line_items") || []

  const lineItemTotals = lineItems.map(item => {
    const quantity = item.unit_quantity || 0
    const price = item.unit_price || 0
    return quantity * price
  })

  const grandTotal = lineItemTotals.reduce((sum, total) => sum + total, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-muted-foreground">Loading job details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
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
            <h2 className="text-3xl font-bold tracking-tight">Edit Job</h2>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-8 border rounded-md">
          <AlertCircle className="h-8 w-8 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error</h3>
          <p className="text-muted-foreground text-center mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard/subcontractor/jobs')}>
            Back to Jobs
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 hover:bg-primary/10 transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Go back</span>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Edit Job</h2>
          <p className="text-muted-foreground">
            Update your job submission
          </p>
        </div>
      </div>

      <Card className="border-primary/20 shadow-md">
        <CardHeader className="bg-muted/30">
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Update information about your job
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Site A, Building B"
                        {...field}
                        className="focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 bg-muted/20 p-4 rounded-lg border border-muted">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem className="bg-card p-3 rounded-md shadow-sm">
                      <FormLabel className="text-sm font-medium">Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          disabled={isSubmitting}
                          className="border-primary/20 focus-within:ring-1 focus-within:ring-primary/30"
                        />
                      </FormControl>
                      <FormDescription className="text-xs mt-1">
                        When the job will begin
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem className="bg-card p-3 rounded-md shadow-sm">
                      <FormLabel className="text-sm font-medium">End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          disabled={isSubmitting}
                          className="border-primary/20 focus-within:ring-1 focus-within:ring-primary/30"
                        />
                      </FormControl>
                      <FormDescription className="text-xs mt-1">
                        When the job will be completed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Line Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ item_name: "", unit_quantity: 1, unit_price: 0 })}
                    disabled={isSubmitting}
                    className="bg-primary/10 hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="border rounded-md p-5 space-y-5 shadow-sm bg-card hover:border-primary/30 transition-colors"
                    style={{
                      borderLeft: index % 2 === 0 ? '4px solid #e2e8f0' : '4px solid #cbd5e1'
                    }}
                  >
                    <div className="flex justify-between items-center border-b pb-3">
                      <h4 className="font-medium text-primary">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                          disabled={isSubmitting}
                          className="text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          <span className="text-xs">Remove</span>
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`line_items.${index}.item_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Item Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. Plumbing, Electrical"
                              {...field}
                              className="focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_quantity`}
                        render={({ field }) => (
                          <FormItem className="bg-muted/30 p-3 rounded-md">
                            <FormLabel className="text-sm font-medium">Unit Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30"
                              />
                            </FormControl>
                            <FormDescription className="text-xs mt-1">
                              Number of units (hours, pieces, etc.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem className="bg-muted/30 p-3 rounded-md">
                            <FormLabel className="text-sm font-medium">Unit Price (RM)</FormLabel>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <span className="text-muted-foreground">RM</span>
                              </div>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  className="pl-10 bg-background focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30"
                                />
                              </FormControl>
                            </div>
                            <FormDescription className="text-xs mt-1">
                              Price per unit in Malaysian Ringgit
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-muted p-4 rounded-md shadow-inner">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Item Total:</span>
                        <span className="text-md font-bold text-primary">
                          {formatCurrency(lineItemTotals[index] || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="bg-primary/5 p-5 rounded-lg shadow-sm border border-primary/20">
                  <h3 className="text-lg font-semibold mb-3">Order Summary</h3>

                  {/* Line items summary */}
                  <div className="space-y-2 mb-4">
                    {lineItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.item_name || `Item ${index + 1}`}</span>
                        <span>{formatCurrency(lineItemTotals[index] || 0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="border-t border-primary/20 my-3"></div>

                  {/* Grand total */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Grand Total:</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sum of all line item totals
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details or special requirements"
                        className="min-h-[120px] focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs mt-1">
                      Include any special instructions or additional information about this job
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => router.back()}
                  className="hover:bg-destructive/10 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Job"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}