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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          setUser({
            ...user,
            profile
          })
        }
      }
    }
    fetchUser()
  }, [supabase])
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign out failed",
          description: error.message,
        })
        return
      }
      
      router.push("/auth/login")
      
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
            {user?.profile?.contact_person || user?.profile?.company_name || user?.email || "User"}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.profile?.contact_person?.charAt(0) ||
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
              {user?.profile?.contact_person || user?.profile?.company_name || "User"}
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
