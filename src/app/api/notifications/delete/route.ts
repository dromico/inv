import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  console.log('API: Notification delete request received');
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    console.log('API: Supabase client initialized');
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('API: Authentication error', userError);
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
      }, { status: 401 });
    }
    console.log('API: User authenticated', user.id);
    
    // Parse the request body
    const body = await request.json();
    const { notificationId } = body;
    console.log('API: Request body parsed', { notificationId });
    
    if (!notificationId) {
      console.log('API: Missing notification ID');
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
      console.error('API: Error fetching notification:', notificationError);
      return NextResponse.json({
        success: false,
        message: 'Notification not found',
      }, { status: 404 });
    }
    console.log('API: Notification found', notification);
    
    if (notification.recipient_id !== user.id) {
      console.log('API: Permission denied - notification belongs to', notification.recipient_id);
      return NextResponse.json({
        success: false,
        message: 'You do not have permission to delete this notification',
      }, { status: 403 });
    }
    
    // Delete the notification
    console.log('API: Attempting to delete notification', notificationId);
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (deleteError) {
      console.error('API: Error deleting notification:', deleteError);
      return NextResponse.json({
        success: false,
        message: `Database error: ${deleteError.message}`,
      }, { status: 500 });
    }
    
    console.log('API: Notification deleted successfully');
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
