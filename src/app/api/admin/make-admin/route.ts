import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      )
    }
    
    const cookieStore = cookies()
    const supabase = createServerComponentClient()
    
    // First get the user by email from auth table
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      return NextResponse.json(
        { success: false, message: `Error listing users: ${usersError.message}` },
        { status: 500 }
      )
    }
    
    const user = users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: `User with email ${email} not found` },
        { status: 404 }
      )
    }
    
    // Update the user's profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
    
    if (updateError) {
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
