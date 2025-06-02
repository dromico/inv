import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
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
      console.error('Authentication error:', userError);
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
      }, { status: 401 });
    }

    console.log(`Delete request from user: ${user.email} (${user.id})`);

    // Check if the current user is an admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('profiles')
      .select('role, company_name')
      .eq('id', user.id)
      .single();

    if (adminCheckError) {
      console.error('Error checking admin status:', adminCheckError);
      return NextResponse.json({
        success: false,
        message: 'Error verifying admin privileges',
      }, { status: 500 });
    }

    if (!adminCheck || adminCheck.role !== 'admin') {
      console.warn(`Non-admin user ${user.email} attempted to delete subcontractor`);
      return NextResponse.json({
        success: false,
        message: 'Admin privileges required',
      }, { status: 403 });
    }

    console.log(`Admin user ${user.email} (${adminCheck.company_name}) verified for delete operation`);
    
    // Parse the request body
    const { subcontractorId } = await request.json();
    
    if (!subcontractorId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Subcontractor ID is required',
      }, { status: 400 });
    }
    
    // Verify the subcontractor exists and is actually a subcontractor
    const { data: subcontractor, error: subcontractorError } = await supabase
      .from('profiles')
      .select('role, company_name')
      .eq('id', subcontractorId)
      .single();
    
    if (subcontractorError || !subcontractor) {
      return NextResponse.json({ 
        success: false, 
        message: 'Subcontractor not found',
      }, { status: 404 });
    }
    
    if (subcontractor.role !== 'subcontractor') {
      return NextResponse.json({ 
        success: false, 
        message: 'The specified user is not a subcontractor',
      }, { status: 400 });
    }
    
    console.log(`Starting deletion process for subcontractor: ${subcontractor.company_name} (${subcontractorId})`);

    // Create admin client for auth operations
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Delete the user from auth.users first (this is the critical operation that was failing)
    console.log('Attempting to delete user from auth.users...');
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(subcontractorId);

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json({
        success: false,
        message: `Auth deletion error: ${authDeleteError.message}`,
      }, { status: 500 });
    }

    console.log('Successfully deleted user from auth.users');

    // Delete the profile (this will cascade to all related data due to foreign key constraints)
    console.log('Attempting to delete profile and related data...');
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', subcontractorId);

    if (deleteError) {
      console.error('Error deleting subcontractor profile:', deleteError);
      return NextResponse.json({
        success: false,
        message: `Database error: ${deleteError.message}`,
        note: 'Auth user was deleted but profile deletion failed',
      }, { status: 500 });
    }

    console.log('Successfully deleted profile and related data');
    
    return NextResponse.json({ 
      success: true, 
      message: `Subcontractor ${subcontractor.company_name} has been deleted successfully`,
    });
  } catch (error) {
    console.error('Unexpected error in subcontractor deletion:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}
