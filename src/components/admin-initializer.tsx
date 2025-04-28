"use client"

import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

export function AdminInitializer() {
  const [initialized, setInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Only run once
    if (initialized) return
      async function initializeAdmin() {
      try {
        // Try the new ensure-admin endpoint first
        const ensureResponse = await fetch('/api/ensure-admin', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (ensureResponse.ok) {
          const result = await ensureResponse.json()
          console.log('Admin initialization successful:', result.message)
          return
        }
        
        console.warn('Ensure admin failed, trying fix-admin as fallback')
        
        // Fallback to the fix-admin endpoint
        const response = await fetch('/api/fix-admin', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          console.log('Admin initialization successful (fallback)')
        } else {
          console.error('Admin initialization failed:', await response.json())
        }
      } catch (error) {
        console.error('Error initializing admin:', error)
      } finally {
        setInitialized(true)
      }
    }

    // Wait a bit for the app to fully initialize
    const timer = setTimeout(() => {
      initializeAdmin()
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [initialized])
  
  // This component doesn't render anything
  return null
}
