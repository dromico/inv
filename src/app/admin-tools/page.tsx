"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AdminTools() {
  const [email, setEmail] = useState('romico@gmail.com')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  async function handleFixAdmin() {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/fix-admin')
      const data = await response.json()
      
      if (response.ok) {
        setResult({ success: true, message: data.message })
        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        setResult({ success: false, message: data.error || 'Something went wrong' })
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || 'Something went wrong',
        })
      }
    } catch (error) {
      console.error('Error fixing admin:', error)
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fix admin user",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleMakeAdmin() {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address",
      })
      return
    }
    
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        setResult({ success: true, message: data.message })
        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        setResult({ success: false, message: data.message || 'Something went wrong' })
        toast({
          variant: "destructive",
          title: "Error",
          description: data.message || 'Something went wrong',
        })
      }
    } catch (error) {
      console.error('Error making admin:', error)
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      })
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to make user an admin",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Admin Tools</CardTitle>
          <CardDescription>
            Fix user roles and permissions
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Fix romico@gmail.com Admin</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will ensure romico@gmail.com has the admin role in the profiles table.
            </p>
            
            <Button 
              onClick={handleFixAdmin}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                'Fix romico@gmail.com Admin Role'
              )}
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-2">Make User Admin</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Assign the admin role to any user by email.
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <Button 
                onClick={handleMakeAdmin}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Make Admin'
                )}
              </Button>
            </div>
          </div>
          
          {result && (
            <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'} flex items-start`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              )}
              <p>{result.message}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            These tools should be used by system administrators only.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
