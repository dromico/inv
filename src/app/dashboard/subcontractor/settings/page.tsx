"use client"

import { useState, useEffect } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar } from "@/components/ui/avatar"
import { User, Settings, Bell, Shield, Mail } from "lucide-react"

interface Profile {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  address: string
  business_registration: string
  services: string[]
  bio: string
  avatar_url?: string
}

interface NotificationPreferences {
  email_notifications: boolean
  job_updates: boolean
  invoice_updates: boolean
  system_announcements: boolean
}

export default function SubcontractorSettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email_notifications: true,
    job_updates: true,
    invoice_updates: true,
    system_announcements: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }
      
      // In a real implementation, you would fetch the profile from the database
      // For now, we'll use mock data
      const mockProfile: Profile = {
        id: user.id,
        company_name: "ABC Construction Services",
        contact_name: "John Smith",
        email: user.email || "john@abcconstruction.com",
        phone: "+60123456789",
        address: "123 Main Street, Kuala Lumpur, Malaysia",
        business_registration: "REG12345678",
        services: ["Electrical", "Plumbing", "General Construction"],
        bio: "ABC Construction Services has been providing quality construction services for over 10 years. We specialize in electrical, plumbing, and general construction work."
      }
      
      setProfile(mockProfile)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        variant: "destructive",
        title: "Failed to load profile",
        description: "There was a problem loading your profile. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

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

  // Handle loading state with skeleton UI
  if (loading) {
    return <SettingsLoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex space-x-2 border-b">
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
        </div>
        
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your company and contact information
              </CardDescription>
            </CardHeader>
            <form onSubmit={updateProfile}>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-medium uppercase">
                      {profile?.company_name?.charAt(0) || 'A'}
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
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input 
                      id="company_name" 
                      value={profile?.company_name || ''} 
                      onChange={(e) => setProfile({...profile!, company_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_name">Contact Person</Label>
                    <Input 
                      id="contact_name" 
                      value={profile?.contact_name || ''} 
                      onChange={(e) => setProfile({...profile!, contact_name: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={profile?.email || ''} 
                      onChange={(e) => setProfile({...profile!, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      value={profile?.phone || ''} 
                      onChange={(e) => setProfile({...profile!, phone: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address</Label>
                  <Textarea 
                    id="address" 
                    value={profile?.address || ''} 
                    onChange={(e) => setProfile({...profile!, address: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business_registration">Business Registration Number</Label>
                    <Input 
                      id="business_registration" 
                      value={profile?.business_registration || ''} 
                      onChange={(e) => setProfile({...profile!, business_registration: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="services">Services Offered</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select services" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="construction">General Construction</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="painting">Painting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Company Bio</Label>
                  <Textarea 
                    id="bio" 
                    value={profile?.bio || ''} 
                    onChange={(e) => setProfile({...profile!, bio: e.target.value})}
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
        
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified
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
                  <Label htmlFor="job_updates">Job Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about job status changes
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    job_updates: !notificationPrefs.job_updates
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.job_updates ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="invoice_updates">Invoice Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Notifications about invoice status changes
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    invoice_updates: !notificationPrefs.invoice_updates
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.invoice_updates ? 'translate-x-5' : 'translate-x-0'
                  }`}></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="system_announcements">System Announcements</Label>
                  <p className="text-sm text-muted-foreground">
                    Important system updates and announcements
                  </p>
                </div>
                <div className="h-6 w-11 cursor-pointer rounded-full bg-muted p-1" 
                  onClick={() => setNotificationPrefs({
                    ...notificationPrefs, 
                    system_announcements: !notificationPrefs.system_announcements
                  })}>
                  <div className={`h-4 w-4 rounded-full bg-white transition-all ${
                    notificationPrefs.system_announcements ? 'translate-x-5' : 'translate-x-0'
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
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>
                  Manage your email settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Primary Email</Label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.email}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Change Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
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
        <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-10 w-[400px]" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    </div>
  )
}