"use client"

import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { User, Bell, Shield, Cog, FileText } from "lucide-react"

interface AdminProfile {
  id: string
  name: string
  email: string
  phone: string
  role: string
  department: string
  avatar_url?: string
}

interface SystemSettings {
  maintenance_mode: boolean
  allow_new_registrations: boolean
  default_invoice_due_days: number
  system_email: string
}

interface NotificationPreferences {
  email_notifications: boolean
  new_subcontractor_alerts: boolean
  job_submission_alerts: boolean
  invoice_alerts: boolean
  system_alerts: boolean
}

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    maintenance_mode: false,
    allow_new_registrations: true,
    default_invoice_due_days: 30,
    system_email: "system@example.com"
  })
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_notifications: true,
    new_subcontractor_alerts: true,
    job_submission_alerts: true,
    invoice_alerts: true,
    system_alerts: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [invoiceRecipientText, setInvoiceRecipientText] = useState("")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const loadSettingsData = useCallback(async () => {
    try {
      setLoading(true)

      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      // Fetch Profile (Mock for now)
      const mockProfile: AdminProfile = {
        id: user.id,
        name: "Admin User",
        email: user.email || "admin@example.com",
        phone: "+60123456789",
        role: "System Administrator",
        department: "IT Operations"
      }
      setProfile(mockProfile)

      // Fetch Invoice Settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('invoice_settings')
        .select('setting_value')
        .eq('setting_key', 'invoice_recipient_text')
        .single();

      if (settingsError) {
        console.error('Error fetching invoice settings:', settingsError);
        toast({
          variant: "destructive",
          title: "Failed to load invoice settings",
          description: "Using default value.",
        })
        setInvoiceRecipientText('To Whom It May Concern,') // Default value
      } else if (settingsData) {
        setInvoiceRecipientText(settingsData.setting_value);
      }

      // TODO: Fetch other settings (System, Notifications) from DB if needed

    } catch (error) {
      console.error('Error loading settings data:', error)
      toast({
        variant: "destructive",
        title: "Failed to load settings",
        description: "There was a problem loading settings data. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    loadSettingsData()
  }, [loadSettingsData])

  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // In a real implementation, you would update the database
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: "There was a problem updating your profile. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSystemSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // In a real implementation, you would update the database
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "System settings updated",
        description: "System settings have been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating system settings:', error)
      toast({
        variant: "destructive",
        title: "Failed to update settings",
        description: "There was a problem updating system settings. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationPreferences = async () => {
    try {
      setSaving(true)
      
      // In a real implementation, you would update the database
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Notification preferences updated",
        description: "Your notification preferences have been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      toast({
        variant: "destructive",
        title: "Failed to update preferences",
        description: "There was a problem updating your notification preferences. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // In a real implementation, you would update the password
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      })
      
      // Reset the form
      const form = e.target as HTMLFormElement
      form.reset()
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        variant: "destructive",
        title: "Failed to update password",
        description: "There was a problem updating your password. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateInvoiceSettings = async () => {
    try {
      setSaving(true)

      const { error } = await supabase
        .from('invoice_settings')
        .update({ setting_value: invoiceRecipientText })
        .eq('setting_key', 'invoice_recipient_text')

      if (error) throw error

      toast({
        title: "Invoice settings updated",
        description: "Invoice recipient text has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating invoice settings:', error)
      toast({
        variant: "destructive",
        title: "Failed to update invoice settings",
        description: "There was a problem updating the invoice settings. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle loading state with skeleton UI
  if (loading) {
    return <SettingsLoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and system settings
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-2 border-b overflow-x-auto">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'system' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            <div className="flex items-center gap-2">
              <Cog className="h-4 w-4" />
              <span>System</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'notifications' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'security' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </div>
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'invoice' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => setActiveTab('invoice')}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Invoice</span>
            </div>
          </button>
        </div>
        
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <form onSubmit={updateProfile}>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-medium uppercase">
                      {profile?.name?.charAt(0) || 'A'}
                    </div>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      value={profile?.name || ''} 
                      onChange={(e) => setProfile({...profile!, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile?.email || ''} 
                      onChange={(e) => setProfile({...profile!, email: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={profile?.phone || ''} 
                      onChange={(e) => setProfile({...profile!, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input 
                      id="role" 
                      value={profile?.role || ''} 
                      onChange={(e) => setProfile({...profile!, role: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    value={profile?.department || ''} 
                    onChange={(e) => setProfile({...profile!, department: e.target.value})}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
        
        {activeTab === 'system' && (
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure global system settings
              </CardDescription>
            </CardHeader>
            <form onSubmit={updateSystemSettings}>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable maintenance mode to temporarily disable user access
                    </p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                    onClick={() => setSystemSettings({
                      ...systemSettings, 
                      maintenance_mode: !systemSettings.maintenance_mode
                    })}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                      systemSettings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow_new_registrations">Allow New Registrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new subcontractors to register on the platform
                    </p>
                  </div>
                  <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                    onClick={() => setSystemSettings({
                      ...systemSettings, 
                      allow_new_registrations: !systemSettings.allow_new_registrations
                    })}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                      systemSettings.allow_new_registrations ? 'translate-x-5' : 'translate-x-0'
                    }`}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_invoice_due_days">Default Invoice Due Days</Label>
                  <Input 
                    id="default_invoice_due_days" 
                    type="number"
                    min="1"
                    max="90"
                    value={systemSettings.default_invoice_due_days} 
                    onChange={(e) => setSystemSettings({
                      ...systemSettings, 
                      default_invoice_due_days: parseInt(e.target.value) || 30
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of days until an invoice is due by default
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="system_email">System Email</Label>
                  <Input 
                    id="system_email" 
                    type="email"
                    value={systemSettings.system_email} 
                    onChange={(e) => setSystemSettings({
                      ...systemSettings, 
                      system_email: e.target.value
                    })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email address used for system notifications
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save System Settings'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
        
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose which notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    email_notifications: !notificationPrefs.email_notifications
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.email_notifications ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new_subcontractor_alerts">New Subcontractor Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new subcontractors register
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    new_subcontractor_alerts: !notificationPrefs.new_subcontractor_alerts
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.new_subcontractor_alerts ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="job_submission_alerts">Job Submission Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when new jobs are submitted
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    job_submission_alerts: !notificationPrefs.job_submission_alerts
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.job_submission_alerts ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="invoice_alerts">Invoice Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about invoice status changes
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    invoice_alerts: !notificationPrefs.invoice_alerts
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.invoice_alerts ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="system_alerts">System Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about system events and issues
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    system_alerts: !notificationPrefs.system_alerts
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.system_alerts ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={updateNotificationPreferences} disabled={saving}>
                {saving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <form onSubmit={updatePassword}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input id="current_password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input id="new_password" type="password" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input id="confirm_password" type="password" required />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Updating...' : 'Update Password'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Not enabled
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Shield className="mr-2 h-4 w-4" />
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'invoice' && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Settings</CardTitle>
              <CardDescription>
                Customize default text used in generated invoices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invoice_recipient_text">Default Recipient Text</Label>
                <Textarea
                  id="invoice_recipient_text"
                  value={invoiceRecipientText}
                  onChange={(e) => setInvoiceRecipientText(e.target.value)}
                  rows={3}
                  placeholder="e.g., To Whom It May Concern,"
                />
                <p className="text-sm text-muted-foreground">
                  This text appears near the top of the invoice before the job details.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={updateInvoiceSettings} disabled={saving}>
                {saving ? 'Saving...' : 'Save Invoice Settings'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}

// Loading skeleton component
function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">
          Manage your account and system settings
        </p>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-10 w-[400px]" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  )
}