"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { jobSchema } from "@/lib/validations"
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
import { ArrowLeft } from "lucide-react"

type FormValues = z.infer<typeof jobSchema>

export default function NewJobPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      job_type: "",
      location: "",
      start_date: new Date(),
      end_date: new Date(),
      unit: 1,
      unit_price: 0,
      notes: "",
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      setIsSubmitting(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("You must be logged in to create a job")
      }
      
      // Calculate total (unit * unit_price)
      const total = data.unit * data.unit_price
      
      // Insert job into the database
      const { error } = await supabase
        .from('jobs')
        .insert({
          subcontractor_id: user.id,
          job_type: data.job_type,
          location: data.location,
          start_date: format(data.start_date, "yyyy-MM-dd"),
          end_date: format(data.end_date, "yyyy-MM-dd"),
          unit: data.unit,
          unit_price: data.unit_price,
          total: total, // Include the calculated total
          notes: data.notes || null,
          status: 'pending',
        })
      
      if (error) throw error
      
      toast({
        title: "Job Created",
        description: "Your job has been submitted successfully.",
      })
      
      router.push('/dashboard/subcontractor/jobs')
    } catch (error) {
      console.error('Error creating job:', error)
      toast({
        variant: "destructive",
        title: "Failed to create job",
        description: "There was a problem creating your job. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate and format total
  const watchUnit = form.watch("unit") || 0
  const watchUnitPrice = form.watch("unit_price") || 0
  const total = watchUnit * watchUnitPrice

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
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
          <h2 className="text-3xl font-bold tracking-tight">New Job</h2>
          <p className="text-muted-foreground">
            Submit a new job for review
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>
            Provide information about the job you&apos;ve completed or plan to complete
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Plumbing, Electrical" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Site A, Building B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Number of units (hours, pieces, etc.)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unit_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Price (RM)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Price per unit in Malaysian Ringgit
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="bg-muted p-4 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="text-lg font-bold">{formatCurrency(total)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated automatically as unit quantity × unit price
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any additional details or special requirements"
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Job"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
