"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signupSchema } from "@/lib/validations"
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

type FormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Initialize form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      company_name: "",
      contact_person: "",
      phone_number: "",
      address: "",
    },
  })

  async function onSubmit(data: FormValues) {
    try {
      setIsLoading(true)

      // Sign up with email and password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        throw authError
      }

      if (!authData.user) {
        throw new Error("User creation failed")
      }

      // Create a profile entry for the new user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          company_name: data.company_name,
          contact_person: data.contact_person || null,
          phone_number: data.phone_number || null,
          address: data.address || null,
          role: 'subcontractor', // Default role for new users
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue even if profile creation fails, as we can handle this later
      }

      toast({
        title: "Signup successful",
        description: "Your account has been created. Please check your email to verify your account.",
      })

      // Redirect to signup success page
      router.push('/auth/signup-success')

    } catch (error: unknown) {
      console.error('Signup error:', error)

      const errorMessage = error instanceof Error
        ? error.message
        : "There was a problem creating your account. Please try again."

      toast({
        variant: "destructive",
        title: "Signup failed",
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
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
                Create an Account
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <CardDescription className="text-center text-gray-600 dark:text-gray-400">
                Enter your details to create a subcontractor account
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

                <div className="grid gap-4 md:grid-cols-2">
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
                              autoComplete="new-password"
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
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="******"
                              type="password"
                              autoComplete="new-password"
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
                </div>

                <AnimatedFormField index={3}>
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Company Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Your company name"
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

                <AnimatedFormField index={4}>
                  <FormField
                    control={form.control}
                    name="contact_person"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-300">Contact Person (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Full name"
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

                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatedFormField index={5}>
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">Phone Number (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 601X-XXXXXXX"
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
                  <AnimatedFormField index={6}>
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-300">Address (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Business address"
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
                </div>

                <AnimatedFormField index={7}>
                  <ShimmerButton
                    type="submit"
                    className="w-full text-white font-medium"
                    disabled={isLoading}
                    shimmerColor="rgba(255, 255, 255, 0.4)"
                    background="black"
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
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
              Already have an account?{" "}
              <Link href="/auth/login" className="text-black dark:text-white font-medium underline-offset-4 hover:underline transition-colors">
                Sign in
              </Link>
            </motion.div>
            <Button variant="ghost" asChild className="px-0 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </CardFooter>
        </MagicCard>
      </motion.div>
    </div>
  )
}
