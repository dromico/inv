import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

// This API endpoint returns the current profile data for debugging
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerComponentClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      return NextResponse.json({ 
        success: false, 
        message: `Authentication error: ${userError.message}`,
        auth_status: 'not_authenticated'
      }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not authenticated',
        auth_status: 'not_authenticated'
      }, { status: 401 });
    }
    
    // Get profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      // For diagnostic purposes, try to get all profiles
      const { data: allProfiles, error: allProfilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      return NextResponse.json({
        success: false,
        message: `Profile error: ${profileError.message}`,
        error_code: profileError.code,
        error_details: profileError.details,
        user_id: user.id,
        email: user.email,
        auth_status: 'authenticated',
        profile_exists: false,
        sample_profiles: allProfilesError ? null : allProfiles
      });
    }
    
    // Successful response
    return NextResponse.json({
      success: true,
      message: 'Profile retrieved successfully',
      auth_status: 'authenticated',
      user_id: user.id,
      email: user.email,
      profile_exists: true,
      profile: profileData,
      is_admin: profileData?.role === 'admin',
      should_be_admin: user.email === 'romico@gmail.com'
    });
  } catch (error) {
    console.error('Error in profile-check endpoint:', error);
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      error_type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}
