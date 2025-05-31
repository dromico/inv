"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

// Define the profile schema for validation
const profileSchema = z.object({
  company_name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  contact_person: z.string().min(2, { message: "Contact person name is required" }).nullable(),
  phone_number: z.string().min(5, { message: "Phone number is required" }).nullable(),
  address: z.string().min(5, { message: "Address is required" }).nullable(),
  // Additional fields can be added here
});

// Define the notification preferences schema
const notificationSchema = z.object({
  email_notifications: z.boolean(),
  job_updates: z.boolean(),
  invoice_updates: z.boolean(),
  system_announcements: z.boolean(),
});

// Define the password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z
    .string()
    .min(6, { message: "New password must be at least 6 characters" })
    .max(64, { message: "New password cannot be longer than 64 characters" }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match",
  path: ["confirmNewPassword"]
});

// Define types based on the schemas
type ProfileFormValues = z.infer<typeof profileSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

// Define the email change schema
const emailChangeSchema = z.object({
  newEmail: z.string().email({ message: "Please enter a valid email address" }),
});

type EmailChangeFormValues = z.infer<typeof emailChangeSchema>;

export default function SubcontractorSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [userEmail, setUserEmail] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Initialize forms
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company_name: "",
      contact_person: "",
      phone_number: "",
      address: "",
    },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      email_notifications: true,
      job_updates: true,
      invoice_updates: true,
      system_announcements: true,
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const emailChangeForm = useForm<EmailChangeFormValues>({
    resolver: zodResolver(emailChangeSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please sign in to access your settings.",
        })
        setLoading(false)
        return
      }

      // Set the user email
      if (user.email) {
        setUserEmail(user.email)
      }

      // Fetch the profile from the database
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error loading profile:', profileError)
        toast({
          variant: "destructive",
          title: "Failed to load profile",
          description: "There was a problem loading your profile. Please try again.",
        })
        setLoading(false)
        return
      }

      if (profileData) {
        // Reset the form with the fetched data
        profileForm.reset({
          company_name: profileData.company_name || "",
          contact_person: profileData.contact_person || "",
          phone_number: profileData.phone_number || "",
          address: profileData.address || "",
        })
      }
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

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setSaving(true)

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: "Please sign in to update your profile.",
        })
        return
      }

      // Call the API to update the profile
      const response = await fetch('/api/subcontractor/settings/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile')
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        variant: "destructive",
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "There was a problem updating your profile. Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  const onNotificationSubmit = async (data: NotificationFormValues) => {
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

  const onPasswordSubmit = async (data: PasswordFormValues) => {
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
      passwordForm.reset()
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

  const onEmailChangeSubmit = async (data: EmailChangeFormValues) => {
    try {
      setSaving(true)

      // In a real implementation, you would update the email
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Update the displayed email
      setUserEmail(data.newEmail)

      toast({
        title: "Email updated",
        description: "Your email has been updated successfully.",
      })

      // Reset the form and hide it
      emailChangeForm.reset()
      setShowEmailForm(false)
    } catch (error) {
      console.error('Error updating email:', error)
      toast({
        variant: "destructive",
        title: "Failed to update email",
        description: "There was a problem updating your email. Please try again.",
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
    <div className="space-y-6 px-2 sm:px-4 md:px-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex space-x-1 sm:space-x-2 border-b overflow-x-auto">
          <button
            className={`px-2 py-1 sm:px-3 md:px-4 sm:py-2 font-medium ${activeTab === 'profile' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </div>
          </button>
          <button
            className={`px-2 py-1 sm:px-3 md:px-4 sm:py-2 font-medium ${activeTab === 'notifications' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </div>
          </button>
          <button
            className={`px-2 py-1 sm:px-3 md:px-4 sm:py-2 font-medium ${activeTab === 'security' ? 'border-b-2 border-primary' : ''}`}
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
            <CardHeader className="p-3 sm:p-5 md:p-6">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your company and contact information
              </CardDescription>
            </CardHeader>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5 md:p-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <div className="flex h-full w-full items-center justify-center bg-muted text-xl font-medium uppercase">
                        {profileForm.getValues().company_name?.charAt(0) || 'A'}
                      </div>
                    </Avatar>
                    <div>
                      <Button variant="outline" size="sm" type="button">
                        Change Avatar
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={profileForm.control}
                      name="company_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="contact_person"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <FormField
                      control={profileForm.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="p-3 sm:p-5 md:p-6">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}

        {activeTab === 'notifications' && (
          <Card>
            <CardHeader className="p-3 sm:p-5 md:p-6">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5 md:p-6">
                  <FormField
                    control={notificationForm.control}
                    name="email_notifications"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-2 sm:p-3 md:p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive notifications via email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="job_updates"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-2 sm:p-3 md:p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Job Updates</FormLabel>
                          <FormDescription>
                            Notifications about job status changes
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="invoice_updates"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-2 sm:p-3 md:p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Invoice Updates</FormLabel>
                          <FormDescription>
                            Notifications about invoice status changes
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={notificationForm.control}
                    name="system_announcements"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-2 sm:p-3 md:p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">System Announcements</FormLabel>
                          <FormDescription>
                            Important system updates and announcements
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="p-3 sm:p-5 md:p-6">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="p-3 sm:p-5 md:p-6">
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5 md:p-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmNewPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="p-3 sm:p-5 md:p-6">
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            </Card>

            <Card>
              <CardHeader className="p-3 sm:p-5 md:p-6">
                <CardTitle>Email Preferences</CardTitle>
                <CardDescription>
                  Manage your email settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5 md:p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Primary Email</Label>
                      <p className="text-sm text-muted-foreground">
                        {userEmail || "No email found"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEmailForm(!showEmailForm)}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {showEmailForm ? 'Cancel' : 'Change Email'}
                    </Button>
                  </div>

                  {showEmailForm && (
                    <Form {...emailChangeForm}>
                      <form onSubmit={emailChangeForm.handleSubmit(onEmailChangeSubmit)} className="space-y-4">
                        <FormField
                          control={emailChangeForm.control}
                          name="newEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter your new email address" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Updating...' : 'Update Email'}
                        </Button>
                      </form>
                    </Form>
                  )}
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
    <div className="space-y-6 px-2 sm:px-4 md:px-6">
      <div>
        <Skeleton className="h-8 w-[250px] mb-2" />
        <Skeleton className="h-4 w-[350px]" />
      </div>

      <div className="space-y-4">
        <div className="flex space-x-1 sm:space-x-2 border-b overflow-x-auto">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>

        <Card>
          <CardHeader className="p-3 sm:p-5 md:p-6">
            <Skeleton className="h-6 w-[200px] mb-2" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-5 md:p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-9 w-[120px]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
          <CardFooter className="p-3 sm:p-5 md:p-6">
            <Skeleton className="h-10 w-[120px]" />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}