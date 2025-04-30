"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function JobSubmissionSuccess() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [showSuccess, setShowSuccess] = useState(false)
  
  useEffect(() => {
    // Check if the URL has a success parameter
    const success = searchParams.get("success")
    
    if (success === "true") {
      setShowSuccess(true)
      
      // Also show a toast notification for immediate feedback
      toast({
        title: "Job Submitted Successfully",
        description: "Your job has been created and is now pending review.",
        duration: 5000, // Show for 5 seconds
      })
      
      // Hide the success message after 10 seconds
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 10000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams, toast])
  
  if (!showSuccess) return null
  
  return (
    <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 flex items-center text-green-800 animate-fadeIn">
      <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
      <div>
        <p className="font-medium">Job submitted successfully!</p>
        <p className="text-sm text-green-700">Your job has been created and is now pending review.</p>
      </div>
    </div>
  )
}