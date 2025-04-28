"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";

interface HealthCheck {
  name: string;
  status: "success" | "error" | "pending";
  message: string;
}

export default function HealthCheckPage() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: "Authentication", status: "pending", message: "Not checked yet" },
    { name: "Profile Exists", status: "pending", message: "Not checked yet" },
    { name: "Role Column Exists", status: "pending", message: "Not checked yet" },
    { name: "Admin Role Set", status: "pending", message: "Not checked yet" },
    { name: "RLS Policies", status: "pending", message: "Not checked yet" },
    { name: "Special Admin Case", status: "pending", message: "Not checked yet" }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const supabase = createClientComponentClient();
  
  // Get the current user email on mount
  useEffect(() => {
    async function getUserEmail() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
      }
    }
    
    getUserEmail();
  }, [supabase]);
  
  const runHealthCheck = async () => {
    setLoading(true);
    
    // Reset checks
    setChecks(checks.map(check => ({ ...check, status: "pending", message: "Checking..." })));
    
    // Check 1: Authentication
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        updateCheck("Authentication", "success", `Authenticated as ${user.email}`);
      } else {
        updateCheck("Authentication", "error", "Not authenticated");
      }
    } catch (error) {
      updateCheck("Authentication", "error", `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check 2: Profile Exists
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateCheck("Profile Exists", "error", "No user authenticated");
      } else {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          updateCheck("Profile Exists", "error", `No profile found: ${error.message}`);
        } else {
          updateCheck("Profile Exists", "success", `Profile found for ${user.email}`);
        }
      }
    } catch (error) {
      updateCheck("Profile Exists", "error", `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check 3: Role Column Exists
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'profiles' AND column_name = 'role'
        `
      });
      
      if (error) {
        updateCheck("Role Column Exists", "error", `Error: ${error.message}`);
      } else if (data && data.length > 0) {
        updateCheck("Role Column Exists", "success", `Role column exists with type ${data[0].data_type}`);
      } else {
        updateCheck("Role Column Exists", "error", "Role column does not exist in profiles table");
      }
    } catch (error) {
      updateCheck("Role Column Exists", "error", `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check 4: Admin Role Set
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        updateCheck("Admin Role Set", "error", "No user authenticated");
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          updateCheck("Admin Role Set", "error", `Error: ${error.message}`);
        } else if (data.role === 'admin') {
          updateCheck("Admin Role Set", "success", `User has admin role`);
        } else {
          updateCheck("Admin Role Set", "error", `User has role: ${data.role}`);
        }
      }
    } catch (error) {
      updateCheck("Admin Role Set", "error", `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check 5: RLS Policies
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: `SELECT * FROM pg_policies WHERE tablename = 'profiles'`
      });
      
      if (error) {
        updateCheck("RLS Policies", "error", `Error: ${error.message}`);
      } else {
        const count = data?.length || 0;
        updateCheck("RLS Policies", "success", `Found ${count} policies for profiles table`);
      }
    } catch (error) {
      updateCheck("RLS Policies", "error", `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Check 6: Special Admin Case
    try {
      if (email === 'romico@gmail.com') {
        updateCheck("Special Admin Case", "success", "You are logged in as the special admin user");
      } else {
        // Check if romico@gmail.com exists and has admin role
        const { data, error } = await supabase.rpc('exec_sql', {
          query: `
            SELECT p.role 
            FROM profiles p 
            JOIN auth.users u ON p.id = u.id 
            WHERE u.email = 'romico@gmail.com'
          `
        });
        
        if (error) {
          updateCheck("Special Admin Case", "error", `Error: ${error.message}`);
        } else if (data && data.length > 0) {
          updateCheck(
            "Special Admin Case", 
            data[0].role === 'admin' ? "success" : "error",
            `romico@gmail.com has role: ${data[0].role}`
          );
        } else {
          updateCheck("Special Admin Case", "error", "romico@gmail.com not found or has no profile");
        }
      }
    } catch (error) {
      updateCheck("Special Admin Case", "error", `Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    setLoading(false);
  };
  
  const updateCheck = (name: string, status: "success" | "error" | "pending", message: string) => {
    setChecks(currentChecks => currentChecks.map(check => 
      check.name === name ? { ...check, status, message } : check
    ));
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>System Health Check</CardTitle>
          <CardDescription>Verify that all admin functionality is working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Button 
              onClick={runHealthCheck} 
              disabled={loading}
            >
              {loading ? "Running Checks..." : "Run Health Check"}
            </Button>
          </div>
          
          <div className="space-y-4">
            {checks.map((check, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-md border ${
                  check.status === 'success' ? 'bg-green-50 border-green-200' : 
                  check.status === 'error' ? 'bg-red-50 border-red-200' : 
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start">
                  {check.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  ) : check.status === 'error' ? (
                    <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-medium">{check.name}</h3>
                    <p className="text-sm">{check.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
