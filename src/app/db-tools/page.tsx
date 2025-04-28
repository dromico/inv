"use client";

import { useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function SqlRunnerPage() {
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const predefinedActions = [
    {
      name: "Grant Admin Role to romico@gmail.com",
      sql: `
-- Add role column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'subcontractor';
    RAISE NOTICE 'Added role column';
  END IF;
END $$;

-- Update romico@gmail.com to be admin
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'romico@gmail.com');
      `
    },
    {
      name: "Check Current Profiles",
      sql: `SELECT * FROM profiles LIMIT 10;`
    },
    {
      name: "Check Auth Users",
      sql: `SELECT * FROM auth.users LIMIT 10;`
    },
    {
      name: "Check RLS Policies",
      sql: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
    },
    {
      name: "Create Profile for romico@gmail.com",
      sql: `
INSERT INTO profiles (id, company_name, contact_person, role, created_at, updated_at)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'romico@gmail.com'),
  'Admin User',
  'System Administrator',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();`
    }
  ];
  
  const runSql = async (sqlToRun: string = sql) => {
    if (!sqlToRun.trim()) {
      toast({
        variant: "destructive",
        title: "SQL Required",
        description: "Please enter SQL to run",
      });
      return;
    }
    
    setStatus("loading");
    setResult(null);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        query: sqlToRun
      });
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      setStatus("success");
      toast({
        title: "SQL Executed Successfully",
        description: "The SQL query completed without errors",
      });
    } catch (error) {
      console.error("SQL error:", error);
      setResult(error);
      setStatus("error");
      toast({
        variant: "destructive",
        title: "SQL Error",
        description: error instanceof Error ? error.message : "Failed to run SQL",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>SQL Runner</CardTitle>
          <CardDescription>
            Execute SQL commands for database management and debugging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sql">SQL Command</Label>
            <Textarea
              id="sql"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              className="min-h-[200px] font-mono"
              placeholder="Enter SQL to execute..."
            />
          </div>
          
          <div>
            <Button 
              onClick={() => runSql()} 
              disabled={status === "loading"}
              className="w-full"
            >
              {status === "loading" ? "Executing..." : "Run SQL"}
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
            {predefinedActions.map((action, i) => (
              <Button 
                key={i} 
                variant="outline" 
                onClick={() => {
                  setSql(action.sql);
                  runSql(action.sql);
                }}
              >
                {action.name}
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex-col items-start">
          {result && (
            <div className="w-full pt-4">
              <h3 className="font-medium mb-2">
                Result {status === "success" ? "✅" : status === "error" ? "❌" : ""}
              </h3>
              <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[400px] w-full text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* API Testing Section */}
      <Card>
        <CardHeader>
          <CardTitle>API Tests</CardTitle>
          <CardDescription>Test common admin-related API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setStatus("loading");
                  const response = await fetch('/api/profile-check');
                  const data = await response.json();
                  setResult(data);
                  setStatus("success");
                } catch (error) {
                  console.error("API error:", error);
                  setResult(error);
                  setStatus("error");
                }
              }}
            >
              Check Current Profile
            </Button>
            
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setStatus("loading");
                  const response = await fetch('/api/fix-admin');
                  const data = await response.json();
                  setResult(data);
                  setStatus("success");
                } catch (error) {
                  console.error("API error:", error);
                  setResult(error);
                  setStatus("error");
                }
              }}
            >
              Fix Admin User
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
