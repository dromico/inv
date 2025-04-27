"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema } from "@/lib/validations"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

type FormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  
  // Get redirect URL from query params
  const redirect = searchParams.get('redirect')
  
  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      setIsLoading(true)
      
      // Sign in with email and password
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      
      if (error) {
        throw error
      }
      
      // Get user data
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("User not found")
      }
      
      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('Error fetching profile:', profileError)
      }
      
      // Default to 'subcontractor' if profile not found or role not set
      const role = profile?.role || 'subcontractor'
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
      })
      
      // Redirect to the appropriate dashboard or requested page
      if (redirect) {
        router.push(decodeURIComponent(redirect))
      } else {
        if (role === 'admin') {
          router.push('/dashboard/admin')
        } else {
          router.push('/dashboard/subcontractor')
        }
      }
      
    } catch (error: unknown) {
      console.error('Login error:', error)
      
      const errorMessage = error instanceof Error
        ? error.message
        : "Invalid email or password. Please try again."
      
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email address"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="******"
                        type="password"
                        autoComplete="current-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </div>
          <Button variant="link" asChild className="px-0">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
