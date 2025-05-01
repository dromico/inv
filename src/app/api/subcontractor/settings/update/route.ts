import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server'; // Corrected import
import { cookies } from 'next/headers';
import { z } from 'zod';

// Define the profile schema for validation
const profileSchema = z.object({
  company_name: z.string().min(2, { message: "Company name must be at least 2 characters" }),
  contact_person: z.string().min(2, { message: "Contact person name is required" }).nullable(),
  phone_number: z.string().min(5, { message: "Phone number is required" }).nullable(),
  address: z.string().min(5, { message: "Address is required" }).nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: cookieStore }); // Corrected client initialization
    
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication required',
      }, { status: 401 });
    }
    
    // Parse and validate the request body
    const body = await request.json();
    
    try {
      const validatedData = profileSchema.parse(body);
      
      // Update the profile in the database
      const { data, error } = await supabase
        .from('profiles')
        .update({
          company_name: validatedData.company_name,
          contact_person: validatedData.contact_person,
          phone_number: validatedData.phone_number,
          address: validatedData.address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ 
          success: false, 
          message: `Database error: ${error.message}`,
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Profile updated successfully',
        data,
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        // Return validation errors
        return NextResponse.json({ 
          success: false, 
          message: 'Validation error',
          errors: validationError.errors,
        }, { status: 400 });
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Unexpected error in profile update:', error);
    return NextResponse.json({ 
      success: false, 
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    }, { status: 500 });
  }
}