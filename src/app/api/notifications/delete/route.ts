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
    
    // Parse the request body
    const { notificationId } = await request.json();
    
    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Notification ID is required',
      }, { status: 400 });
    }
    
    // Verify the notification exists and belongs to the current user
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('id, recipient_id')
      .eq('id', notificationId)
      .single();
    
    if (notificationError) {
      console.error('Error fetching notification:', notificationError);
      return NextResponse.json({ 
        success: false, 
        message: 'Notification not found',
      }, { status: 404 });
    }
    
    if (notification.recipient_id !== user.id) {
      return NextResponse.json({ 
        success: false, 
        message: 'You do not have permission to delete this notification',
      }, { status: 403 });
    }
    
    // Delete the notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (deleteError) {
      console.error('Error deleting notification:', deleteError);
      return NextResponse.json({ 
        success: false, 
        message: `Database error: ${deleteError.message}`,
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Unexpected error in notification deletion:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}
