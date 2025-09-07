import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { instructions } = await req.json();

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-10-01',
        voice: 'alloy',
        instructions: instructions
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.client_secret?.value) {
      console.error('No client_secret in response:', data);
      return NextResponse.json(
        { error: 'Invalid response from OpenAI API' },
        { status: 500 }
      );
    }

    return NextResponse.json({ token: data.client_secret.value });

  } catch (error) {
    console.error('Error generating realtime token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
