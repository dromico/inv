import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });

    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
      }, { status: 401 });
    }

    // Update all unread notifications for the current user
    // Include updated_at field to handle the database trigger
    const { error: updateError } = await supabase
      .from('notifications')
      .update({
        read: true,
        updated_at: new Date().toISOString()
      })
      .eq('recipient_id', user.id)
      .eq('read', false);

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json({
        success: false,
        message: `Database error: ${updateError.message}`,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'All notifications marked as read successfully',
    });
  } catch (error) {
    console.error('Unexpected error in marking all notifications as read:', error);
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}
