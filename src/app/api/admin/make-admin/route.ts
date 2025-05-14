import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js' // Import direct client
import { cookies } from 'next/headers'
import { Database } from '@/types/database' // Assuming you have this type

// Helper function to create an admin client
// Ensure environment variables are set correctly on your server
const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase URL or Service Role Key is missing in environment variables.')
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }

    // Use the admin client for operations requiring elevated privileges
    const supabaseAdmin = createAdminClient()

    // First get the user by email from auth table using the admin client
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers()

    if (usersError) {
      console.error("Error listing users:", usersError.message)
      return NextResponse.json(
        { success: false, message: `Error listing users: ${usersError.message}` },
        { status: 500 }
      )
    }

    // Note: listUsers() returns { data: { users: User[] } } structure
    const user = usersData?.users.find(u => u.email === email)

    if (!user) {
      console.log(`User with email ${email} not found.`)
      return NextResponse.json(
        { success: false, message: `User with email ${email} not found` },
        { status: 404 }
      )
    }

    // Update the user's profile using the admin client
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)

    if (updateError) {
      console.error(`Error updating role for ${email} (ID: ${user.id}):`, updateError.message)
      return NextResponse.json(
        { success: false, message: `Error updating role: ${updateError.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `User ${email} has been made an admin successfully`
    })
  } catch (error) {
    console.error('Error in makeAdmin API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    )
  }
}
