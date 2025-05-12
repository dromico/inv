import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container flex flex-col items-center justify-center gap-4 px-4 text-center md:px-6 max-w-5xl">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Durafloor And Jayanexus Subcontractor Work Management System
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              A comprehensive platform for our subcontractors to submit jobs and administrators to manage and track the progress of their work.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Start for Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container grid items-center justify-center gap-4 px-4 md:px-6 max-w-5xl">
          <div className="space-y-3 text-center">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Simplify Your Work Process
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Manage your jobs, invoices, and payments all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8 pt-8">
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-background">
              <div className="p-2 rounded-full bg-primary/10">
                <Image
                  src="/globe.svg"
                  alt="Globe icon"
                  width={24}
                  height={24}
                  className="h-6 w-6 text-primary"
                />
              </div>
              <h3 className="text-xl font-bold">Easy Job Submission</h3>
              <p className="text-muted-foreground text-center">
                Submit job details, track progress, and get paid without hassle.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-background">
              <div className="p-2 rounded-full bg-primary/10">
                <Image
                  src="/window.svg"
                  alt="Window icon"
                  width={24}
                  height={24}
                  className="h-6 w-6 text-primary"
                />
              </div>
              <h3 className="text-xl font-bold">Automated Invoicing</h3>
              <p className="text-muted-foreground text-center">
                Automatic invoice generation and payment tracking for your jobs.
              </p>
            </div>
            <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-background">
              <div className="p-2 rounded-full bg-primary/10">
                <Image
                  src="/vercel.svg"
                  alt="Vercel icon"
                  width={24}
                  height={24}
                  className="h-6 w-6 text-primary"
                />
              </div>
              <h3 className="text-xl font-bold">Comprehensive Dashboard</h3>
              <p className="text-muted-foreground text-center">
                View all your jobs and financial data in a clear, intuitive dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6 max-w-5xl">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join hundreds of subcontractors managing their work effectively.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Create an Account</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t mt-auto">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} SubConMgmt V1.0 (2025). Durafloor & Jayanexus. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Privacy
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Contact
          </Link>
        </nav>
      </footer>
    </div>
  )
}
