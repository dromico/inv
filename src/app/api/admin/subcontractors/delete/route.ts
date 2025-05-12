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
    
    // Check if the current user is an admin
    const { data: adminCheck, error: adminCheckError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (adminCheckError || !adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: 'Admin privileges required',
      }, { status: 403 });
    }
    
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
    
    // Delete the profile (this will cascade to all related data due to foreign key constraints)
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', subcontractorId);
    
    if (deleteError) {
      console.error('Error deleting subcontractor profile:', deleteError);
      return NextResponse.json({ 
        success: false, 
        message: `Database error: ${deleteError.message}`,
      }, { status: 500 });
    }
    
    // Delete the user from auth.users
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(subcontractorId);
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      return NextResponse.json({ 
        success: false, 
        message: `Auth deletion error: ${authDeleteError.message}`,
        note: 'Profile was deleted but auth user remains',
      }, { status: 500 });
    }
    
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
