import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

// This API endpoint specifically fixes admin permissions for romico@gmail.com
// It ensures both the profile and user metadata have the correct admin role
export async function GET(request: NextRequest) {
  try {
    // Use createServerComponentClient without arguments to fix TypeScript error
    const supabase = createServerComponentClient();
    
    // Also create a service client with admin privileges for operations that require it
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('Starting admin fix for romico@gmail.com');
    
    // Find the user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return NextResponse.json({
        success: false,
        message: `Error listing users: ${userError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    const adminUser = users.users.find(user => user.email === 'romico@gmail.com');
    
    if (!adminUser) {
      console.error('User romico@gmail.com not found');
      return NextResponse.json({
        success: false,
        message: 'User romico@gmail.com not found',
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
    
    console.log('Found user romico@gmail.com with ID:', adminUser.id);
    
    // Update the profile with admin role
    const { error: upsertError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: adminUser.id,
        role: 'admin',
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (upsertError) {
      console.error('Error updating profile:', upsertError);
      return NextResponse.json({
        success: false,
        message: `Error updating profile: ${upsertError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Update user metadata
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      { user_metadata: { role: 'admin' } }
    );
    
    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      return NextResponse.json({
        success: false,
        message: `Error updating user metadata: ${metadataError.message}`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    console.log('Successfully fixed admin permissions for romico@gmail.com');
    
    return NextResponse.json({
      success: true,
      message: 'Successfully fixed admin permissions for romico@gmail.com',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in fix-admin endpoint:', error);
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}