"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema } from "@/lib/validations"
import { createClientComponentClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { motion } from "framer-motion"

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
import { MagicCard } from "@/components/magicui/magic-card"
import { AnimatedFormField } from "@/components/magicui/animated-form-field"
import { ShimmerButton } from "@/components/magicui/shimmer-button"
import { WrenchIcon } from "@/components/magicui/wrench-icon"

type FormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
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
      const signInResponse = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInResponse.error) {
        throw signInResponse.error
      }

      // Get user data
      const { data: userData, error: getUserError } = await supabase.auth.getUser()

      if (getUserError || !userData?.user) {
        console.error('Error getting user after sign in:', getUserError)
        throw new Error("User not found after sign in")
      }

      const user = userData.user
        // Debug user data
      console.log('User authenticated:', user.email, 'User ID:', user.id);

      // First check if profiles table exists and if user has a profile
      try {
        // Try to create a profile if it doesn't exist
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (checkError) {
          console.log('Profile check error details:', checkError.code, checkError.message, checkError.details);

          if (checkError.code === 'PGRST116') {
            // Profile doesn't exist, create one
            console.log('Profile not found for user, creating profile...');
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                company_name: user.email?.split('@')[0] || 'User',
                contact_person: user.user_metadata?.name || null,
                role: user.email === 'romico@gmail.com' ? 'admin' : 'subcontractor',
                created_at: new Date(),
                updated_at: new Date()
              });

            if (insertError) {
              console.error('Error creating profile:', insertError.code, insertError.message, insertError.details);
            } else {
              console.log('Profile created successfully');
            }
          }
        } else {
          console.log('Existing profile found:', existingProfile);
        }
      } catch (profileCreationError) {
        console.error('Unexpected error creating profile:', profileCreationError);
      }

      // Get role from profile table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, company_name')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error getting profile:', profileError.code, profileError.message, profileError.details);
        // Continue with default role if profile fetch fails
      }

      // Force admin role for romico@gmail.com
      let role = profile?.role || 'subcontractor';
      if (user.email === 'romico@gmail.com') {
        role = 'admin';
        console.log('Forcing admin role for romico@gmail.com');
      }

      console.log('User login successful:', user.email, 'Role:', role);

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

      // Only set loading to false on error
      // This keeps the button in loading state during redirect
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <MagicCard
          className="overflow-hidden backdrop-blur-sm bg-white dark:bg-black border border-gray-200 dark:border-gray-800"
          shineBorderProps={{
            shineColor: ["#ffffff", "#cccccc", "#ffffff"],
            duration: 8
          }}
        >
          <CardHeader className="space-y-2 flex flex-col items-center">
            <WrenchIcon size={48} className="mb-2" />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <CardTitle className="text-3xl font-bold text-center text-black dark:text-white">
                Sign In
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                Enter your credentials to access your account
              </CardDescription>
            </motion.div>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <AnimatedFormField index={0}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Email address"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AnimatedFormField>

                <AnimatedFormField index={1}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="******"
                            type="password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="bg-white dark:bg-black border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-white transition-all duration-200"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </AnimatedFormField>

                <AnimatedFormField index={2}>
                  <ShimmerButton
                    type="submit"
                    className="w-full text-white font-medium"
                    disabled={isLoading}
                    shimmerColor="rgba(255, 255, 255, 0.4)"
                    background="black"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </ShimmerButton>
                </AnimatedFormField>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 p-6 pt-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-sm text-center text-gray-600 dark:text-gray-400"
            >
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="text-black dark:text-white font-medium underline-offset-4 hover:underline transition-colors">
                Sign up
              </Link>
            </motion.div>
            <div className="flex justify-between w-full">
              <Button variant="ghost" asChild className="px-0 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                <Link href="/">
                  Back to Home
                </Link>
              </Button>
              {/* Hidden button for emergency admin fix */}
              <Button
                variant="ghost"
                size="sm"
                className="text-xs opacity-50 hover:opacity-100 text-gray-500 dark:text-gray-500 hover:text-black dark:hover:text-white"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/fix-admin');
                    const result = await response.json();
                    if (result.success) {
                      toast({
                        title: "Admin Fix Applied",
                        description: result.message,
                      });
                    } else {
                      toast({
                        variant: "destructive",
                        title: "Admin Fix Failed",
                        description: result.message,
                      });
                    }
                  } catch (error) {
                    console.error('Error applying admin fix:', error);
                  }
                }}
              >
                Fix Admin
              </Button>
            </div>
          </CardFooter>
        </MagicCard>
      </motion.div>
    </div>
  )
}
