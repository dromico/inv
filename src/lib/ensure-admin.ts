import { createClient } from '@supabase/supabase-js';

// This function can be imported and called from any server component
// to ensure that romico@gmail.com always has admin role
export async function ensureRomicoAdmin() {
  try {
    // Create a service client with admin privileges
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
    
    console.log('Checking admin status for romico@gmail.com');
    
    // Try to find the user by email
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return false;
    }
    
    const adminUser = users.users.find(user => user.email === 'romico@gmail.com');
    
    if (!adminUser) {
      console.error('User romico@gmail.com not found');
      return false;
    }
    
    console.log('Found user romico@gmail.com with ID:', adminUser.id);
    
    // Check if the user has a profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 means "no rows returned" which is fine - we'll create the profile
      console.error('Error checking for profile:', profileError);
      return false;
    }
    
    if (profile) {
      // Update the existing profile
      console.log('Updating existing profile for romico@gmail.com');
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUser.id);
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        return false;
      }
      
      console.log('Successfully updated profile for romico@gmail.com with admin role');
    } else {
      // Create a new profile
      console.log('Creating new profile for romico@gmail.com');
      const { error: insertError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: adminUser.id,
          company_name: 'Admin User',
          contact_person: 'System Administrator',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
        return false;
      }
      
      console.log('Successfully created profile for romico@gmail.com with admin role');
    }
    
    // Also update the user metadata in auth.users
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      { user_metadata: { role: 'admin' } }
    );
    
    if (metadataError) {
      console.error('Error updating user metadata:', metadataError);
      // Continue anyway as the profile table is the main source of truth
    } else {
      console.log('Successfully updated user metadata for romico@gmail.com');
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error in ensureRomicoAdmin:', error);
    return false;
  }
}
