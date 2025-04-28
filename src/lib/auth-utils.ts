"use server"

import { createClientComponentClient } from "./supabase"
import { createServerComponentClient } from "./supabase-server"
import { cookies } from "next/headers"

/**
 * Gets the current user role from the profiles table
 * This is used on the client-side
 */
export async function getUserRole() {
  const supabase = createClientComponentClient()
  
  // Get user data
  const { data: userData, error: userError } = await supabase.auth.getUser()
  
  if (userError || !userData.user) {
    console.error('Error getting user:', userError)
    return null
  }
  
  // Get profile data to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single()
  
  if (profileError) {
    console.error('Error getting profile:', profileError)
    return null
  }
  
  return profile?.role || 'subcontractor'
}

/**
 * Gets the current user role from the profiles table
 * This is used on the server-side
 */
export async function getUserRoleServer() {
  const supabase = createServerComponentClient()
  
  // Get user data
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.user) {
    return null
  }
  
  // Get profile data to determine role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()
  
  if (profileError) {
    console.error('Error getting profile:', profileError)
    return null
  }
  
  return profile?.role || 'subcontractor'
}

/**
 * Helper function to update a user's role
 * This would typically be used by an admin
 */
export async function updateUserRole(userId: string, role: 'admin' | 'subcontractor') {
  const supabase = createClientComponentClient()
  
  // First, verify the current user is an admin
  const currentUserRole = await getUserRole()
  
  if (currentUserRole !== 'admin') {
    throw new Error('Only admins can update user roles')
  }
  
  // Update the user's role in the profiles table
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
  
  if (error) {
    console.error('Error updating user role:', error)
    throw error
  }
  
  return true
}

/**
 * Set a specific email to be an admin (for initial setup)
 * This should be used once to create the first admin user
 */
export async function setAdminByEmail(email: string) {
  const supabase = createClientComponentClient()
  
  // Get the user by email
  const { data: userData, error: userError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()
  
  if (userError || !userData) {
    console.error('User not found:', email)
    return false
  }
  
  // Update the user's role to admin
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userData.id)
  
  if (error) {
    console.error('Error updating user role:', error)
    return false
  }
  
  return true
}
