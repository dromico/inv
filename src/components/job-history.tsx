"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { format } from "date-fns"
import { Job } from "@/types"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface JobHistoryProps {
  jobId: string
}

interface JobHistoryEntry {
  timestamp: string
  status: string
  notes?: string
}

export function JobHistory({ jobId }: JobHistoryProps) {
  const [history, setHistory] = useState<JobHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchJobHistory() {
      try {
        setLoading(true)
        
        // Fetch the job to get its creation date and current status
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('created_at, status, updated_at')
          .eq('id', jobId)
          .single()
        
        if (jobError) throw jobError
        
        if (!jobData) {
          setHistory([])
          return
        }
        
        // Create history entries
        const historyEntries: JobHistoryEntry[] = [
          {
            timestamp: jobData.created_at,
            status: 'pending',
            notes: 'Job submitted'
          }
        ]
        
        // If the job status is not pending, add an entry for the status change
        if (jobData.status !== 'pending' && jobData.updated_at) {
          historyEntries.push({
            timestamp: jobData.updated_at,
            status: jobData.status,
            notes: `Job marked as ${jobData.status}`
          })
        }
        
        // Sort history by timestamp (newest first)
        historyEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        
        setHistory(historyEntries)
      } catch (error) {
        console.error('Error fetching job history:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchJobHistory()
  }, [jobId, supabase])
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const formatTimestamp = (timestamp: string) => {
    try {
      return format(new Date(timestamp), "PPP 'at' p")
    } catch (e) {
      return 'Invalid date'
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
        <span className="text-muted-foreground">Loading history...</span>
      </div>
    )
  }
  
  if (history.length === 0) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        No history available for this job.
      </div>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Job History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((entry, index) => (
            <div key={index} className="border-l-2 pl-4 pb-4 relative">
              <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 border ${getStatusBadgeClass(entry.status)}`} />
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadgeClass(entry.status)}`}>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                {entry.notes && (
                  <p className="text-sm mt-1">{entry.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
