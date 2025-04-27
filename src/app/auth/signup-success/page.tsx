import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-300" />
          </div>
          <CardTitle className="text-2xl font-bold text-center mt-5">Registration Successful!</CardTitle>
          <CardDescription className="text-center">
            Your account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            We&apos;ve sent a confirmation email to your inbox. Please check your email and follow the instructions to verify your account.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don&apos;t see the email, please check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/login">
              Proceed to Login
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/">
              Back to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
