import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function POST(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const body = await request.json();
    const actionPath = params.action.join('/');
    
    const response = await fetch(`${BACKEND_URL}/api/populate/${actionPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'external',
        'Authorization': authHeader
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Failed to proxy populate route: ${actionPath}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in proxy route:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
