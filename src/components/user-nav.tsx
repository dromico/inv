"use client"

import { useState, useEffect } from "react"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export function UserNav() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  // Define a type for the user with profile
  type UserWithProfile = User & {
    profile?: {
      company_name?: string;
      contact_person?: string;
      phone_number?: string;
      address?: string;
      role?: string;
      [key: string]: unknown;
    };
  };

  const [user, setUser] = useState<UserWithProfile | null>(null)

  // Fetch user data on component mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error("Error fetching user:", error);
          return;
        }

        if (data?.user) {
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single()

            if (profileError) {
              console.error("Error fetching profile:", profileError);
            }

            if (profile) {
              setUser({
                ...data.user,
                profile
              })
            } else {
              // Still set the user even without profile
              setUser(data.user)
            }
          } catch (profileFetchError) {
            console.error("Error in profile fetch:", profileFetchError);
            // Still set the user even if profile fetch fails
            setUser(data.user)
          }
        }
      } catch (error) {
        console.error("Error in fetchUser:", error);
      }
    }

    // Call the function and handle any uncaught errors
    fetchUser().catch(error => {
      console.error('Uncaught error in fetchUser:', error);
    });
  }, [supabase])

  const handleSignOut = async () => {
    try {
      setIsLoading(true)

      // Clear any local storage items that might be related to the session
      try {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
      } catch (e) {
        console.log('Error clearing localStorage:', e);
        // Continue even if localStorage clearing fails
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'global' // Sign out from all devices
      })

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign out failed",
          description: error.message,
        })
        return
      }

      // Redirect to login page
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })

      // Use replace instead of push to prevent back navigation to authenticated pages
      router.replace("/auth/login")

    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to sign out. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 hover:bg-accent p-2 rounded-md">
          <span className="hidden md:inline-block">
            {user?.email === "romico@gmail.com"
              ? "Admin"
              : user?.profile?.contact_person || user?.profile?.company_name || user?.email || "User"}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.email === "romico@gmail.com"
                ? "A"
                : user?.profile?.contact_person?.charAt(0) ||
                  user?.profile?.company_name?.charAt(0) ||
                  user?.email?.charAt(0) ||
                  "U"}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.email === "romico@gmail.com"
                ? "Admin"
                : user?.profile?.contact_person || user?.profile?.company_name || user?.email || "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
            {user?.profile?.role && (
              <p className="text-xs leading-none text-muted-foreground mt-1">
                Role: {typeof user.profile.role === 'string'
                  ? user.profile.role.charAt(0).toUpperCase() + user.profile.role.slice(1)
                  : String(user.profile.role)}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={isLoading}
          onClick={handleSignOut}
        >
          {isLoading ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
