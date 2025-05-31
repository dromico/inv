import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

// Handle POST requests to make a user an admin
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

    // First find the user in auth.users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      return NextResponse.json(
        { success: false, message: `Error listing users: ${usersError.message}` },
        { status: 500 }
      )
    }

    const user = users?.users.find(u => u.email === email)

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

    // Update user metadata to include the admin role
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      user.id,
      { user_metadata: { role: 'admin' } }
    )

    if (metadataError) {
      console.error(`Error updating metadata for ${email} (ID: ${user.id}):`, metadataError.message)
      return NextResponse.json(
        { success: false, message: `Error updating user metadata: ${metadataError.message}` },
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
