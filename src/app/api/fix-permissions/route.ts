import { NextRequest, NextResponse } from 'next/server';
import { fixPermissionsAndRoles } from '@/lib/fix-permissions';

export async function GET(request: NextRequest) {
  try {
    const success = await fixPermissionsAndRoles();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Successfully fixed all permissions and roles',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to fix permissions and roles, see server logs for details',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in fix-permissions endpoint:', error);
    return NextResponse.json({
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
