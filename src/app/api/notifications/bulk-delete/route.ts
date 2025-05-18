import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/database';

export async function POST(request: NextRequest) {
  console.log('API: Notification bulk delete request received');
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
    const { notificationIds } = body;
    console.log('API: Request body parsed', { notificationIds, count: notificationIds?.length });
    
    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      console.log('API: Missing or invalid notification IDs');
      return NextResponse.json({
        success: false,
        message: 'Valid notification IDs array is required',
      }, { status: 400 });
    }
    
    // Verify the notifications exist and belong to the current user
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, recipient_id')
      .in('id', notificationIds)
      .eq('recipient_id', user.id);
    
    if (notificationsError) {
      console.error('API: Error fetching notifications:', notificationsError);
      return NextResponse.json({
        success: false,
        message: 'Error fetching notifications',
      }, { status: 500 });
    }
    console.log('API: Notifications found', notifications?.length);
    
    // Check if all requested notifications were found and belong to the user
    if (!notifications || notifications.length !== notificationIds.length) {
      console.log('API: Not all notifications found or belong to user', {
        requested: notificationIds.length,
        found: notifications?.length || 0
      });
      
      // Continue with the ones we found that belong to the user
      if (!notifications || notifications.length === 0) {
        return NextResponse.json({
          success: false,
          message: 'No valid notifications found to delete',
        }, { status: 404 });
      }
    }
    
    // Get the IDs of notifications that belong to the user
    const validNotificationIds = notifications.map(n => n.id);
    console.log('API: Valid notification IDs for deletion', validNotificationIds);
    
    // Delete the notifications
    console.log('API: Attempting to delete notifications', validNotificationIds);
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .in('id', validNotificationIds);
    
    if (deleteError) {
      console.error('API: Error deleting notifications:', deleteError);
      return NextResponse.json({
        success: false,
        message: `Database error: ${deleteError.message}`,
      }, { status: 500 });
    }
    
    console.log('API: Notifications deleted successfully', validNotificationIds.length);
    return NextResponse.json({
      success: true,
      message: `${validNotificationIds.length} notification(s) deleted successfully`,
      deletedCount: validNotificationIds.length,
      deletedIds: validNotificationIds
    });
  } catch (error) {
    console.error('Unexpected error in notification bulk deletion:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}
