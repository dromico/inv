import { createClient } from '@supabase/supabase-js';

export async function fixPermissionsAndRoles() {
  try {
    // Create a service client with admin privileges
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('Starting permissions and roles fix...');
    
    // Step 1: Ensure role column exists in profiles table
    await supabase.rpc('exec_sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'role'
          ) THEN
            ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'subcontractor' NOT NULL;
            RAISE NOTICE 'Added role column to profiles table';
          ELSE
            RAISE NOTICE 'Role column already exists in profiles table';
          END IF;
        END $$;
      `
    });
    console.log('Step 1: Checked role column');
    
    // Step 2: Update policies to use profiles.role instead of raw_user_meta_data
    const policyUpdates = `
      -- Update profiles policies
      DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
      CREATE POLICY "Admins can view all profiles"
        ON profiles FOR SELECT
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
      CREATE POLICY "Admins can update all profiles"
        ON profiles FOR UPDATE
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      -- Update jobs policies
      DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
      CREATE POLICY "Admins can view all jobs"
        ON jobs FOR SELECT
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      DROP POLICY IF EXISTS "Admins can update any job" ON jobs;
      CREATE POLICY "Admins can update any job"
        ON jobs FOR UPDATE
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      DROP POLICY IF EXISTS "Admins can delete any job" ON jobs;
      CREATE POLICY "Admins can delete any job"
        ON jobs FOR DELETE
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      -- Update invoices policies
      DROP POLICY IF EXISTS "Admins can manage all invoices" ON invoices;
      CREATE POLICY "Admins can manage all invoices"
        ON invoices FOR ALL
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      -- Update notifications policies
      DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
      CREATE POLICY "Admins can insert notifications"
        ON notifications FOR INSERT
        WITH CHECK (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
      CREATE POLICY "Admins can view all notifications"
        ON notifications FOR SELECT
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );

      -- Update files policies
      DROP POLICY IF EXISTS "Admins can manage all files" ON files;
      CREATE POLICY "Admins can manage all files"
        ON files FOR ALL
        USING (
          (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
        );
    `;
    
    await supabase.rpc('exec_sql', { query: policyUpdates });
    console.log('Step 2: Updated policies');
    
    // Step 3: Ensure romico@gmail.com has an admin profile
    const { data: users } = await supabase.auth.admin.listUsers();
    const adminUser = users.users.find(user => user.email === 'romico@gmail.com');
    
    if (adminUser) {
      console.log('Found romico@gmail.com user with ID:', adminUser.id);
      
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: adminUser.id,
          company_name: 'Admin User',
          contact_person: 'System Administrator',
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (upsertError) {
        console.error('Error upserting profile:', upsertError);
      } else {
        console.log('Successfully upserted admin profile for romico@gmail.com');
      }
      
      // Also update user metadata
      const { error: metaError } = await supabase.auth.admin.updateUserById(
        adminUser.id,
        { user_metadata: { role: 'admin' } }
      );
      
      if (metaError) {
        console.error('Error updating user metadata:', metaError);
      } else {
        console.log('Successfully updated user metadata for romico@gmail.com');
      }
    } else {
      console.log('User romico@gmail.com not found');
    }
    
    console.log('Permissions and roles fix completed successfully');
    return true;
  } catch (error) {
    console.error('Error fixing permissions and roles:', error);
    return false;
  }
}
