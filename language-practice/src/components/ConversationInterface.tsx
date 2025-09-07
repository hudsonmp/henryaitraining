'use client';

import { useState, useEffect, useRef } from 'react';

interface FormData {
  nativeLanguage: string;
  targetLanguage: string;
  conversationPrompt: string;
}

interface Props {
  formData: FormData;
  onEndConversation: () => void;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

const LANGUAGE_NAMES: { [key: string]: string } = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
};

export default function ConversationInterface({ formData, onEndConversation }: Props) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [isRecording, setIsRecording] = useState(false);
  const [conversationLog, setConversationLog] = useState<Array<{
    type: 'user' | 'ai';
    text: string;
    timestamp: Date;
  }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const generateSystemPrompt = () => {
    const targetLanguage = LANGUAGE_NAMES[formData.targetLanguage] || formData.targetLanguage;
    
    return `You are a helpful language tutor for ${targetLanguage}. Your role is to engage in conversation practice with a language learner.

CONVERSATION TOPIC: ${formData.conversationPrompt}

IMPORTANT INSTRUCTIONS:
- Always respond in ${targetLanguage} only
- Start the conversation by introducing the topic and asking an opening question
- Base your vocabulary and grammar on the conversation prompt provided
- Adjust your speaking level based on the learner's responses:
  * If they seem less advanced: speak slowly, use simpler vocabulary, be more formal/academic, emphasize syllables clearly
  * If they seem more advanced: speak at normal pace, use advanced vocabulary, include colloquialisms and slang
- Keep responses conversational and encouraging
- Gently correct major errors by restating correctly in your response
- Stay within the topic but allow natural conversation flow
- Keep responses to 1-2 sentences to maintain conversation flow

Begin the conversation now by greeting the learner and introducing the topic.`;
  };

  useEffect(() => {
    connectToOpenAI();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const connectToOpenAI = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Get ephemeral token from our API
      const response = await fetch('/api/realtime-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions: generateSystemPrompt()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }

      const { token } = await response.json();

      // Connect to OpenAI Realtime API
      const ws = new WebSocket(
        `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01`,
        ['realtime', `openai-insecure-api-key.${token}`]
      );

      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Connected to OpenAI Realtime API');
        setConnectionStatus('connected');
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: 'session.update',
          session: {
            instructions: generateSystemPrompt(),
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            }
          }
        }));

        // Request AI to start the conversation
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'text', text: 'Hello! Please start our conversation practice session.' }]
          }
        }));

        ws.send(JSON.stringify({ type: 'response.create' }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleRealtimeMessage(message);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to connect to OpenAI:', error);
      setConnectionStatus('error');
    }
  };

  const handleRealtimeMessage = (message: any) => {
    console.log('Received message:', message);
    
    switch (message.type) {
      case 'response.audio.delta':
        // Handle incoming audio from AI
        if (message.delta) {
          playAudioChunk(message.delta);
        }
        break;
      
      case 'conversation.item.input_audio_transcription.completed':
        // User speech transcription
        if (message.transcript) {
          setConversationLog(prev => [...prev, {
            type: 'user',
            text: message.transcript,
            timestamp: new Date()
          }]);
        }
        break;
      
      case 'response.content_part.added':
        // AI response text (for display)
        if (message.part?.type === 'text' && message.part?.text) {
          setConversationLog(prev => [...prev, {
            type: 'ai',
            text: message.part.text,
            timestamp: new Date()
          }]);
        }
        break;
    }
  };

  const playAudioChunk = (audioData: string) => {
    // Convert base64 audio data to playable audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const arrayBuffer = Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer;
    
    audioContext.decodeAudioData(arrayBuffer)
      .then(audioBuffer => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      })
      .catch(error => console.error('Audio playback error:', error));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        sendAudioToOpenAI(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToOpenAI = async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    // Convert audio blob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Send audio data to OpenAI
    wsRef.current.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    }));

    wsRef.current.send(JSON.stringify({
      type: 'input_audio_buffer.commit'
    }));

    wsRef.current.send(JSON.stringify({
      type: 'response.create'
    }));
  };

  const handleEndConversation = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    onEndConversation();
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-black">
            Practicing {LANGUAGE_NAMES[formData.targetLanguage]}
          </h2>
          <p className="text-sm text-black mt-1">Topic: {formData.conversationPrompt}</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} mr-2`}></div>
            <span className="text-sm text-black">{getStatusText()}</span>
          </div>
          <button
            onClick={handleEndConversation}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            End Conversation
          </button>
        </div>
      </div>

      {connectionStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <p className="text-red-800">
            Failed to connect to the conversation service. Please check your internet connection and try again.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-md p-4 max-h-64 overflow-y-auto">
          {conversationLog.length === 0 ? (
            <p className="text-black text-center">Conversation will appear here...</p>
          ) : (
            conversationLog.map((entry, index) => (
              <div key={index} className={`mb-3 ${entry.type === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                  entry.type === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border border-gray-200'
                }`}>
                  <p className="text-sm">{entry.text}</p>
                  <p className={`text-xs mt-1 ${entry.type === 'user' ? 'text-blue-100' : 'text-black'}`}>
                    {entry.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-center">
          {connectionStatus === 'connected' && (
            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              disabled={connectionStatus !== 'connected'}
              className={`w-20 h-20 rounded-full font-medium text-white transition-all ${
                isRecording 
                  ? 'bg-red-500 scale-110 shadow-lg' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } disabled:bg-gray-400 disabled:cursor-not-allowed`}
            >
              {isRecording ? 'Release\nto Send' : 'Hold\nto Speak'}
            </button>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-black">
            Hold the button while speaking, then release to send your message
          </p>
        </div>
      </div>
    </div>
  );
}
