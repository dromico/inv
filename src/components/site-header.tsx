"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { UserNav } from "@/components/user-nav"

export function SiteHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error checking auth session:", error)
          setIsAuthenticated(false)
        } else {
          setIsAuthenticated(!!data.session)
        }
      } catch (error) {
        console.error("Error checking auth status:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    // Call the function and handle any uncaught errors
    checkAuth().catch(error => {
      console.error('Uncaught error in checkAuth:', error)
      setIsLoading(false)
      setIsAuthenticated(false)
    })

    // Set up auth state change listener with error handling
    let subscription: { unsubscribe: () => void } | null = null

    try {
      const { data, error } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setIsAuthenticated(!!session)
        }
      )

      if (error) {
        console.error("Error setting up auth state listener:", error)
      } else {
        subscription = data.subscription
      }
    } catch (error) {
      console.error("Error in auth state change setup:", error)
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe()
        } catch (error) {
          console.error("Error unsubscribing from auth state changes:", error)
        }
      }
    }
  }, [supabase])

  return (
    <header className="px-4 lg:px-6 h-16 flex items-center border-b">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
        <Link
          href="/"
          className="flex items-center space-x-2 font-bold text-xl"
        >
          <Image
            src="/file.svg"
            alt="Logo"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span>SubConMgmt</span>
        </Link>
        <nav className="flex items-center gap-4 sm:gap-6">
          {isLoading ? (
            // Show a loading state while checking auth
            <div className="h-8 w-20 animate-pulse bg-muted rounded"></div>
          ) : isAuthenticated ? (
            // Show user nav when authenticated
            <UserNav />
          ) : (
            // Show login/signup links when not authenticated
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                Sign In
              </Link>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}