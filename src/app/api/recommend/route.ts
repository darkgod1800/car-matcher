import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Proxy the request to our local FastAPI python backend
    // Assuming the Python backend is running on port 8000
    const response = await fetch('http://127.0.0.1:8000/recommend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(`Python API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error proxying to Python backend:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to communicate with AI Backend. Please ensure the Python server is running on port 8000.' 
    }, { status: 500 });
  }
}
