"use client"

import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  BarChart4,
  FileText,
  Download,
  Calendar,
  DollarSign,
  Users,
  Activity,
  FileDown,
  Loader2,
} from "lucide-react"

// Report types
type ReportType = 'financial' | 'activity' | 'subcontractor' | 'job'

// Report data interfaces
interface FinancialReportData {
  period: string
  revenue: number
  expenses: number
  profit: number
  growth: number
}

interface ActivityReportData {
  period: string
  newJobs: number
  completedJobs: number
  activeJobs: number
  conversionRate: number
}

interface SubcontractorReportData {
  id: string
  name: string
  jobsCompleted: number
  activeJobs: number
  totalRevenue: number
  performance: number
}

interface JobReportData {
  id: string
  type: string
  location: string
  subcontractor: string
  startDate: string
  endDate: string
  status: string
  value: number
}

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('financial')
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  })
  const [exportFormat, setExportFormat] = useState<string>('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Sample financial report data
  const financialData: FinancialReportData[] = [
    { period: 'Jan 2025', revenue: 125000, expenses: 78000, profit: 47000, growth: 5.2 },
    { period: 'Feb 2025', revenue: 132000, expenses: 81000, profit: 51000, growth: 8.5 },
    { period: 'Mar 2025', revenue: 145000, expenses: 85000, profit: 60000, growth: 17.6 },
    { period: 'Apr 2025', revenue: 138000, expenses: 82000, profit: 56000, growth: -6.7 },
  ]

  // Sample activity report data
  const activityData: ActivityReportData[] = [
    { period: 'Jan 2025', newJobs: 24, completedJobs: 18, activeJobs: 42, conversionRate: 75 },
    { period: 'Feb 2025', newJobs: 28, completedJobs: 22, activeJobs: 48, conversionRate: 78.6 },
    { period: 'Mar 2025', newJobs: 32, completedJobs: 26, activeJobs: 54, conversionRate: 81.3 },
    { period: 'Apr 2025', newJobs: 30, completedJobs: 28, activeJobs: 56, conversionRate: 93.3 },
  ]

  // Sample subcontractor report data
  const subcontractorData: SubcontractorReportData[] = [
    { id: '1', name: 'ABC Construction', jobsCompleted: 12, activeJobs: 3, totalRevenue: 85000, performance: 92 },
    { id: '2', name: 'XYZ Builders', jobsCompleted: 8, activeJobs: 5, totalRevenue: 62000, performance: 88 },
    { id: '3', name: 'Mega Contractors', jobsCompleted: 15, activeJobs: 2, totalRevenue: 110000, performance: 95 },
    { id: '4', name: 'Prime Services', jobsCompleted: 6, activeJobs: 4, totalRevenue: 45000, performance: 82 },
    { id: '5', name: 'Elite Construction', jobsCompleted: 10, activeJobs: 6, totalRevenue: 78000, performance: 90 },
  ]

  // Sample job report data
  const jobData: JobReportData[] = [
    { id: 'J001', type: 'Renovation', location: 'Kuala Lumpur', subcontractor: 'ABC Construction', startDate: '2025-01-15', endDate: '2025-02-28', status: 'completed', value: 35000 },
    { id: 'J002', type: 'New Build', location: 'Penang', subcontractor: 'XYZ Builders', startDate: '2025-02-10', endDate: '2025-05-20', status: 'in-progress', value: 120000 },
    { id: 'J003', type: 'Repair', location: 'Johor Bahru', subcontractor: 'Mega Contractors', startDate: '2025-03-05', endDate: '2025-03-25', status: 'completed', value: 18000 },
    { id: 'J004', type: 'Maintenance', location: 'Ipoh', subcontractor: 'Prime Services', startDate: '2025-03-15', endDate: '2025-04-15', status: 'in-progress', value: 22000 },
    { id: 'J005', type: 'Extension', location: 'Kuching', subcontractor: 'Elite Construction', startDate: '2025-04-01', endDate: '2025-06-30', status: 'pending', value: 85000 },
  ]

  const generateReport = async () => {
    try {
      setIsGenerating(true)
      
      // In a real application, this would fetch data from the database based on the selected parameters
      // For this demo, we'll use the sample data
      
      setTimeout(() => {
        switch (reportType) {
          case 'financial':
            setReportData(financialData)
            break
          case 'activity':
            setReportData(activityData)
            break
          case 'subcontractor':
            setReportData(subcontractorData)
            break
          case 'job':
            setReportData(jobData)
            break
          default:
            setReportData(null)
        }
        
        setIsGenerating(false)
        
        toast({
          title: "Report generated",
          description: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report has been generated successfully.`,
        })
      }, 1500) // Simulate API delay
      
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        variant: "destructive",
        title: "Failed to generate report",
        description: "There was a problem generating the report. Please try again.",
      })
      setIsGenerating(false)
    }
  }

  const exportReport = () => {
    toast({
      title: "Report exported",
      description: `The report has been exported as ${exportFormat.toUpperCase()}.`,
    })
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

  const getReportIcon = (type: ReportType) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="h-5 w-5" />
      case 'activity':
        return <Activity className="h-5 w-5" />
      case 'subcontractor':
        return <Users className="h-5 w-5" />
      case 'job':
        return <FileText className="h-5 w-5" />
      default:
        return <BarChart4 className="h-5 w-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Generate Reports</h2>
        <p className="text-muted-foreground">
          Create and export various reports for business analysis
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Report Parameters</CardTitle>
            <CardDescription>
              Configure your report settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="activity">Activity Report</SelectItem>
                  <SelectItem value="subcontractor">Subcontractor Report</SelectItem>
                  <SelectItem value="job">Job Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">From</p>
                  <DatePicker
                    date={dateRange.from}
                    setDate={(date) =>
                      setDateRange(prev => ({ ...prev, from: date }))
                    }
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">To</p>
                  <DatePicker
                    date={dateRange.to}
                    setDate={(date) =>
                      setDateRange(prev => ({ ...prev, to: date }))
                    }
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Format</label>
              <Select
                value={exportFormat}
                onValueChange={setExportFormat}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select export format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                  <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={generateReport}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart4 className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center">
                  {getReportIcon(reportType)}
                  <span className="ml-2">
                    {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                  </span>
                </CardTitle>
                <CardDescription>
                  {dateRange.from && dateRange.to ? (
                    <>
                      {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
                    </>
                  ) : (
                    "Select a date range"
                  )}
                </CardDescription>
              </div>
              {reportData && (
                <Button variant="outline" onClick={exportReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export as {exportFormat.toUpperCase()}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Generating report...</p>
              </div>
            ) : reportData ? (
              <div className="overflow-auto">
                {reportType === 'financial' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Expenses</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">Growth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData as FinancialReportData[]).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.period}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.expenses)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(item.profit)}</TableCell>
                          <TableCell className={`text-right ${item.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {item.growth >= 0 ? '+' : ''}{item.growth}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {reportType === 'activity' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">New Jobs</TableHead>
                        <TableHead className="text-right">Completed Jobs</TableHead>
                        <TableHead className="text-right">Active Jobs</TableHead>
                        <TableHead className="text-right">Conversion Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData as ActivityReportData[]).map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.period}</TableCell>
                          <TableCell className="text-right">{item.newJobs}</TableCell>
                          <TableCell className="text-right">{item.completedJobs}</TableCell>
                          <TableCell className="text-right">{item.activeJobs}</TableCell>
                          <TableCell className="text-right">{item.conversionRate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {reportType === 'subcontractor' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcontractor</TableHead>
                        <TableHead className="text-right">Completed Jobs</TableHead>
                        <TableHead className="text-right">Active Jobs</TableHead>
                        <TableHead className="text-right">Total Revenue</TableHead>
                        <TableHead className="text-right">Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData as SubcontractorReportData[]).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell className="text-right">{item.jobsCompleted}</TableCell>
                          <TableCell className="text-right">{item.activeJobs}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalRevenue)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              <span className={`mr-2 ${
                                item.performance >= 90 ? 'text-green-600' : 
                                item.performance >= 80 ? 'text-amber-600' : 
                                'text-red-600'
                              }`}>
                                {item.performance}%
                              </span>
                              <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${
                                    item.performance >= 90 ? 'bg-green-600' : 
                                    item.performance >= 80 ? 'bg-amber-600' : 
                                    'bg-red-600'
                                  }`}
                                  style={{ width: `${item.performance}%` }}
                                />
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {reportType === 'job' && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Subcontractor</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Date Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reportData as JobReportData[]).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.id}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{item.subcontractor}</TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>{formatDate(item.startDate)} - {formatDate(item.endDate)}</TableCell>
                          <TableCell>
                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(item.value)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart4 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No report data to display</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Configure the report parameters on the left and click "Generate Report" to view data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileDown className="h-5 w-5 mr-2 text-blue-500" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Financial Report - Q1 2025</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Activity Report - March 2025</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Subcontractor Performance</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-500" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Monthly Financial Summary</span>
                </div>
                <span className="text-xs text-muted-foreground">Monthly</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Weekly Activity Report</span>
                </div>
                <span className="text-xs text-muted-foreground">Weekly</span>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Quarterly Subcontractor Review</span>
                </div>
                <span className="text-xs text-muted-foreground">Quarterly</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileText className="h-5 w-5 mr-2 text-purple-500" />
              Report Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Executive Summary</span>
                </div>
                <Button variant="ghost" size="sm">
                  Use
                </Button>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Detailed Performance Analysis</span>
                </div>
                <Button variant="ghost" size="sm">
                  Use
                </Button>
              </li>
              <li className="flex justify-between items-center">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Subcontractor Evaluation</span>
                </div>
                <Button variant="ghost" size="sm">
                  Use
                </Button>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}