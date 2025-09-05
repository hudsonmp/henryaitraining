import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('[POST /api/openai-token] Request received');
  
  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('[POST /api/openai-token] Missing OPENAI_API_KEY environment variable');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please check your environment variables.' 
      }, { status: 500 });
    }

    const body = await req.json();
    console.log('[POST /api/openai-token] Request body received:', {
      hasSessionConfig: !!body.sessionConfig,
      sessionConfigKeys: body.sessionConfig ? Object.keys(body.sessionConfig) : [],
      hasModelOverride: !!body.model
    });
    
    const { sessionConfig, model: modelFromClient } = body;

    console.log('[POST /api/openai-token] Making request to OpenAI Realtime Sessions API...');
    
    const requestBody = {
              model: modelFromClient || 'gpt-4o-realtime-preview-2024-10-01',
      voice: sessionConfig.voice || 'alloy',
      instructions: sessionConfig.instructions,
      input_audio_format: sessionConfig.input_audio_format || 'pcm16',
      output_audio_format: sessionConfig.output_audio_format || 'pcm16',
      turn_detection: sessionConfig.turn_detection || {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      input_audio_transcription: sessionConfig.input_audio_transcription || {
        model: 'whisper-1',
      },
    };

    console.log('[POST /api/openai-token] Request payload:', {
      model: requestBody.model,
      voice: requestBody.voice,
      hasInstructions: !!requestBody.instructions,
      instructionsLength: requestBody.instructions?.length || 0
    });

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'realtime=v1',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[POST /api/openai-token] OpenAI API response status:', response.status, response.statusText);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      
      console.error('[POST /api/openai-token] OpenAI API error:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response:', errorText);
      console.error('Headers:', Object.fromEntries(response.headers.entries()));
      
      return NextResponse.json({ 
        error: `OpenAI API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}` 
      }, { status: response.status });
    }

    let data;
    try {
      data = await response.json();
      console.log('[POST /api/openai-token] OpenAI API response received:', {
        hasClientSecret: !!(data.client_secret),
        hasExpiresAt: !!data.expires_at,
        responseKeys: Object.keys(data)
      });
    } catch (error) {
      console.error('[POST /api/openai-token] Failed to parse JSON response:', error);
      return NextResponse.json({ 
        error: 'Invalid response format from OpenAI API' 
      }, { status: 502 });
    }

    // Validate response structure
    if (!data.client_secret || !data.client_secret.value) {
      console.error('[POST /api/openai-token] Invalid response structure - missing client_secret.value');
      console.error('Response data structure:', {
        hasClientSecret: !!data.client_secret,
        clientSecretType: typeof data.client_secret,
        clientSecretKeys: data.client_secret ? Object.keys(data.client_secret) : [],
        fullResponseKeys: Object.keys(data)
      });
      return NextResponse.json({ 
        error: 'Invalid token response from OpenAI API - missing client_secret.value' 
      }, { status: 502 });
    }

    // Additional token validation
    const token = data.client_secret.value;
    if (typeof token !== 'string' || token.length < 10) {
      console.error('[POST /api/openai-token] Invalid token format:', {
        tokenType: typeof token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? token.substring(0, 10) + '...' : 'null'
      });
      return NextResponse.json({ 
        error: 'Invalid token format from OpenAI API' 
      }, { status: 502 });
    }
    
    console.log('[POST /api/openai-token] Successfully obtained ephemeral token');
    return NextResponse.json({ 
      success: true, 
      token: data.client_secret.value,
      expires_at: data.expires_at
    });
  } catch (error: any) {
    console.error('[POST /api/openai-token] Unexpected error occurred:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.code === 'ENOTFOUND') {
      return NextResponse.json({ 
        error: 'Network error: Unable to reach OpenAI API. Please check your internet connection.' 
      }, { status: 503 });
    } else if (error.code === 'ECONNREFUSED') {
      return NextResponse.json({ 
        error: 'Connection refused: OpenAI API is not accessible.' 
      }, { status: 503 });
    } else if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Request timeout: OpenAI API took too long to respond.' 
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      error: error.message || 'Failed to get OpenAI token' 
    }, { status: 500 });
  }
}
