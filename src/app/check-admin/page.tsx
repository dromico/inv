"use client"

import { useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CheckAdminPage() {
  const [email, setEmail] = useState("romico@gmail.com")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  const checkUserRole = async () => {
    if (!email) return
    
    setLoading(true)
    setResult(null)
    
    try {
      const supabase = createClientComponentClient()
      
      // First get the user from auth
      const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        throw authError
      }
      
      const user = users?.find(u => u.email === email)
      
      if (!user) {
        setResult({ error: `User not found with email: ${email}` })
        return
      }
      
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        setResult({ 
          user,
          error: `Error fetching profile: ${profileError.message}`,
          status: "No profile found"
        })
        return
      }
      
      setResult({
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        },
        profile,
        status: profile.role === 'admin' ? "User is an admin" : "User is not an admin"
      })
      
    } catch (error) {
      console.error("Error checking user:", error)
      setResult({ error: error instanceof Error ? error.message : "An unknown error occurred" })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check Admin Status</CardTitle>
          <CardDescription>Verify if a user is an admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Enter email address" 
            />
          </div>
          
          <Button 
            onClick={checkUserRole}
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Checking..." : "Check User Role"}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Results:</h3>
              <pre className="whitespace-pre-wrap text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
