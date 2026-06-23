import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const response = await fetch(`${BACKEND_URL}/api/populate/read/tickets/${params.id}`, {
      method: 'POST', // Backend populate read accepts POST
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'external',
        'Authorization': authHeader
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error('Failed to fetch ticket');
    }

    const data = await response.json();
    return NextResponse.json(data.data || null);
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const authHeader = request.headers.get('authorization') || '';
    
    const response = await fetch(`${BACKEND_URL}/api/populate/update/tickets/${params.id}`, {
      method: 'PUT',
      headers: {
        'x-source': 'external',
        'Authorization': authHeader
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to update ticket');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const response = await fetch(`${BACKEND_URL}/api/populate/delete/tickets/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-source': 'external',
        'Authorization': authHeader
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete ticket');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    );
  }
}