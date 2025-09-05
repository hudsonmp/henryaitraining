interface RealtimeEvent {
  type: string;
  [key: string]: any;
}

interface SessionConfig {
  instructions: string;
  voice: string;
  language: string;
  turn_detection: any;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: any;
}

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private sessionConfig: SessionConfig | null = null;
  private isRecording = false;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;

  // Utility function to format errors for logging
  private formatError(error: any): string {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}${error.stack ? '\n' + error.stack : ''}`;
    } else if (error && typeof error === 'object') {
      // Try to extract meaningful info from the error object
      const errorInfo = {
        type: error.type || 'unknown',
        message: error.message || 'no message',
        code: error.code || 'no code',
        reason: error.reason || 'no reason',
        target: error.target ? error.target.url || 'WebSocket' : 'no target'
      };
      return `Error details: ${JSON.stringify(errorInfo, null, 2)}`;
    } else {
      return `Error: ${String(error)}`;
    }
  }

  // Event callbacks
  public onConnected: (() => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onError: ((error: any) => void) | null = null;
  public onAudioReceived: ((audioData: ArrayBuffer) => void) | null = null;
  public onTranscriptionReceived: ((text: string, isUser: boolean) => void) | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initialize(sessionConfig: SessionConfig): Promise<boolean> {
    this.sessionConfig = sessionConfig;

    try {
      // First, get an ephemeral token from our API with timeout
      console.log('Requesting ephemeral token from /api/openai-token...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let tokenResponse;
      try {
        tokenResponse = await fetch('/api/openai-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionConfig: sessionConfig
          }),
          signal: controller.signal
        });
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Token request timeout: The server took too long to respond. Please try again.');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error || 'Failed to get OpenAI token');
      }

      const tokenData = await tokenResponse.json();
      if (!tokenData.success || !tokenData.token) {
        throw new Error('Invalid token response');
      }

      // Connect to OpenAI Realtime API using the ephemeral token
      const wsUrl = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      console.log('Using ephemeral token:', tokenData.token ? 'Present' : 'Missing');
      console.log('Token data keys:', Object.keys(tokenData));
      console.log('Token length:', tokenData.token ? tokenData.token.length : 'N/A');
      
      // Use required subprotocols: beta flag + ephemeral token
      const tokenProto = `openai-insecure-api-key.${tokenData.token}`;
      const betaProto = 'openai-beta.realtime=v1';
      console.log('Using subprotocols:', [betaProto, tokenProto].map(p => p.substring(0, 50) + '...'));
      
      this.ws = new WebSocket(wsUrl, [betaProto, tokenProto]);
      
      console.log('WebSocket created, readyState:', this.ws.readyState);

      // Set up connection promise to handle async connection
      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket creation failed'));
          return;
        }

        const timeout = setTimeout(() => {
          console.error('WebSocket connection timeout after 15 seconds');
          reject(new Error('WebSocket connection timeout: Unable to establish connection within 15 seconds'));
        }, 15000); // Increased to 15 seconds for better reliability

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('Connected to OpenAI Realtime API with ephemeral token');
          console.log('WebSocket readyState after open:', this.ws?.readyState);
          // Session is already configured via the token endpoint
          this.onConnected?.();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:');
            console.error(this.formatError(error));
            console.error('Raw message data:', event.data);
          }
        };

        this.ws.onerror = () => {
          clearTimeout(timeout);
          console.error('WebSocket onerror (browser event is opaque; details usually appear in onclose)');
          console.error('WebSocket state:', this.ws?.readyState);
          console.error('WebSocket URL:', wsUrl);
          
          const formattedError = new Error('WebSocket error: see onclose for code/reason or server error message frames');
          this.onError?.(formattedError);
          reject(formattedError);
        };

        this.ws.onclose = (event) => {
          clearTimeout(timeout);
          console.log('WebSocket connection closed:');
          console.log('Close code:', event.code);
          console.log('Close reason:', event.reason || 'No reason provided');
          console.log('Was clean:', event.wasClean);
          
          // Provide human-readable close code meanings
          const closeCodeMeanings: { [key: number]: string } = {
            1000: 'Normal closure',
            1001: 'Going away',
            1002: 'Protocol error',
            1003: 'Unsupported data',
            1006: 'Abnormal closure',
            1007: 'Invalid frame payload data',
            1008: 'Policy violation',
            1009: 'Message too big',
            1010: 'Mandatory extension missing',
            1011: 'Internal server error',
            1015: 'TLS handshake failure'
          };
          
          const meaning = closeCodeMeanings[event.code] || 'Unknown close code';
          console.log('Close code meaning:', meaning);
          
          // Provide actionable hint based on code
          let hint = 'Unknown';
          if (event.code === 1006) hint = 'Network/handshake (check connectivity, model URL)';
          else if (event.code === 1002) hint = 'Protocol error (ensure openai-beta.realtime=v1 subprotocol)';
          else if (event.code === 1008) hint = 'Auth/policy issue (ephemeral token/subprotocols)';
          else if (event.code === 1015) hint = 'TLS/SSL issue';
          
          this.onError?.(new Error(`WebSocket closed (${event.code} - ${meaning}). Hint: ${hint}`));
          
          this.onDisconnected?.();
          this.cleanup();
        };
      });
    } catch (error) {
      console.error('Failed to initialize realtime client:');
      console.error(this.formatError(error));
      
      // Create a more informative error for the callback
      const formattedError = error instanceof Error 
        ? error 
        : new Error(`Initialization failed: ${this.formatError(error)}`);
      this.onError?.(formattedError);
      return false;
    }
  }

  private configureSession() {
    if (!this.ws || !this.sessionConfig) return;

    // Send session.update message with configuration
    const sessionUpdate = {
      type: 'session.update',
      session: {
        ...this.sessionConfig,
        // Add authentication in the session configuration
        modalities: ['text', 'audio'],
        // The API key should be passed during the initial connection
        // Since we can't set WebSocket headers in browsers, we need to use a different approach
      }
    };

    this.sendMessage(sessionUpdate);
  }

  private handleMessage(data: RealtimeEvent) {
    console.log('Received message:', data.type);

    switch (data.type) {
      case 'error':
        console.error('Realtime API error:', JSON.stringify(data, null, 2));
        console.error('Full error data:', data);
        // If we get an auth error, it might be due to API key issues
        if (data.error?.type === 'invalid_request_error' && data.error?.code === 'invalid_api_key') {
          this.onError?.(new Error('Invalid API key. Please check your OpenAI API key.'));
        } else {
          this.onError?.(data.error || new Error('Unknown API error occurred'));
        }
        break;

      case 'session.created':
        console.log('Session created successfully');
        break;

      case 'session.updated':
        console.log('Session updated successfully');
        break;

      case 'response.audio.delta':
        // Convert base64 audio to ArrayBuffer and play
        if (data.delta) {
          const audioData = this.base64ToArrayBuffer(data.delta);
          this.onAudioReceived?.(audioData);
        }
        break;

      case 'response.audio_transcript.delta':
        // AI response transcription (streaming)
        if (data.delta) {
          console.log('AI transcript delta:', data.delta);
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User speech transcription
        if (data.transcript) {
          console.log('User transcript:', data.transcript);
          this.onTranscriptionReceived?.(data.transcript, true);
        }
        break;

      case 'response.text.delta':
        // AI response transcription (streaming)
        if (data.delta) {
          console.log('AI text delta:', data.delta);
        }
        break;

      case 'response.text.done':
        // AI response transcription
        if (data.text) {
          console.log('AI text complete:', data.text);
          this.onTranscriptionReceived?.(data.text, false);
        }
        break;

      case 'response.output_item.added':
        // Handle when AI adds content items
        if (data.item && data.item.type === 'message' && data.item.content) {
          const textContent = data.item.content.find((c: any) => c.type === 'text');
          if (textContent && textContent.text) {
            console.log('AI message content:', textContent.text);
            this.onTranscriptionReceived?.(textContent.text, false);
          }
        }
        break;

      case 'response.done':
        console.log('Response completed');
        break;

      default:
        // Handle other message types as needed
        console.log('Unhandled message type:', data.type);
        break;
    }
  }

  private sendMessage(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  async startRecording(): Promise<boolean> {
    if (this.isRecording) return false;

    try {
      // Request microphone access with specific constraints
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });

      // Initialize audio context
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create audio processor
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      this.processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;
        
        try {
          const inputData = event.inputBuffer.getChannelData(0);
          const pcm16Data = this.floatToPCM16(inputData);
          const base64Audio = this.arrayBufferToBase64(pcm16Data);
          
          this.sendMessage({
            type: 'input_audio_buffer.append',
            audio: base64Audio
          });
        } catch (error) {
          console.error('Error processing audio data:');
          console.error(this.formatError(error));
        }
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log('Recording started successfully');
      return true;
    } catch (error) {
      console.error('Error starting recording:');
      console.error(this.formatError(error));
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        this.onError?.(new Error('Microphone access denied. Please allow microphone access and try again.'));
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        this.onError?.(new Error('No microphone found. Please connect a microphone and try again.'));
      } else {
        const formattedError = error instanceof Error 
          ? error 
          : new Error(`Recording failed: ${this.formatError(error)}`);
        this.onError?.(formattedError);
      }
      return false;
    }
  }

  stopRecording() {
    if (!this.isRecording) return;

    this.isRecording = false;
    
    // Clean up audio resources
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    // Send commit message to process the audio
    this.sendMessage({
      type: 'input_audio_buffer.commit'
    });

    // Create a response
    this.sendMessage({
      type: 'response.create'
    });

    console.log('Recording stopped');
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    this.cleanup();
  }

  private cleanup() {
    this.stopRecording();
    this.ws = null;
    this.sessionConfig = null;
  }

  // Utility functions for audio processing
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private floatToPCM16(float32Array: Float32Array): ArrayBuffer {
    const pcm16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const sample = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16Array[i] = sample * 32767;
    }
    return pcm16Array.buffer;
  }

  // Retry helper with exponential backoff and jitter
  async initializeWithRetry(sessionConfig: SessionConfig, maxRetries = 5): Promise<boolean> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let ok = false;
      try {
        ok = await this.initialize(sessionConfig);
      } catch (_e) {
        ok = false;
      }
      if (ok) return true;
      const delay = Math.min(30000, 1000 * 2 ** attempt) + Math.floor(Math.random() * 300);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  }
}