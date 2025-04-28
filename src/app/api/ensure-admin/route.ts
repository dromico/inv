import { NextRequest, NextResponse } from 'next/server';
import { ensureRomicoAdmin } from '@/lib/ensure-admin';

// This API endpoint will ensure romico@gmail.com has admin role
// It can be called on application startup or manually as needed
export async function GET(request: NextRequest) {
  try {
    const success = await ensureRomicoAdmin();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully ensured romico@gmail.com has admin role',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to ensure admin role, see server logs for details',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in ensure-admin endpoint:', error);
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
