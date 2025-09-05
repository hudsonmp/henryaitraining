"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, Mic, MicOff, Play, Square } from "lucide-react";
import toast from "react-hot-toast";
import { RealtimeClient } from "@/lib/realtime-client";

type Language = "english" | "spanish" | "french" | "vietnamese";
type ClassLevel = "1-2" | "3-4" | "5-6" | "7-8" | "ap-language" | "ap-literature";

interface ConversationSetup {
  rubricFile: File | null;
  nativeLanguage: Language;
  learningLanguage: Language;
  conversationPrompt: string;
  classLevel: ClassLevel;
}

const languageOptions: { value: Language; label: string }[] = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "vietnamese", label: "Vietnamese" },
];

const classLevelOptions: { value: ClassLevel; label: string; description: string }[] = [
  { value: "1-2", label: "Classes 1-2", description: "Novice Low-High (memorized words, simple phrases)" },
  { value: "3-4", label: "Classes 3-4", description: "Intermediate Low-Mid (sentences, basic questions)" },
  { value: "5-6", label: "Classes 5-6", description: "Intermediate Mid-High (narration, different time frames)" },
  { value: "7-8", label: "Classes 7-8 Honors", description: "Advanced Low (sustained conversations, explanations)" },
  { value: "ap-language", label: "AP Language", description: "Advanced Mid-High (extended discourse, abstract topics)" },
  { value: "ap-literature", label: "AP Literature", description: "Advanced High-Superior (analysis, persuasion, cultural nuance)" },
];

export default function Home() {
  // Utility function to format errors for logging
  const formatError = (error: any): string => {
    if (error instanceof Error) {
      return `${error.name}: ${error.message}${error.stack ? '\n' + error.stack : ''}`;
    } else if (error && typeof error === 'object') {
      // Try to extract meaningful info from the error object
      const errorInfo = {
        type: error.type || 'unknown',
        message: error.message || 'no message',
        code: error.code || 'no code',
        status: error.status || 'no status',
        statusText: error.statusText || 'no status text'
      };
      return `Error details: ${JSON.stringify(errorInfo, null, 2)}`;
    } else {
      return `Error: ${String(error)}`;
    }
  };

  const [setup, setSetup] = useState<ConversationSetup>({
    rubricFile: null,
    nativeLanguage: "english",
    learningLanguage: "spanish",
    conversationPrompt: "",
    classLevel: "1-2",
  });

  const [isConversationActive, setIsConversationActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<Array<{text: string, isUser: boolean}>>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const realtimeClientRef = useRef<RealtimeClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<ArrayBuffer[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setSetup({ ...setup, rubricFile: file });
        toast.success("Rubric uploaded successfully!");
      } else {
        toast.error("Please upload a PDF file.");
      }
    }
  };

  // Extract text content from PDF (simplified for demo)
  const extractRubricText = async (file: File): Promise<string> => {
    // For now, return a placeholder. In a real implementation, 
    // you'd use a PDF parsing library like pdf-parse or PDF.js
    return `Rubric file: ${file.name} - Content analysis pending`;
  };

  // Initialize audio context for playback
  const initializeAudio = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  // Play received audio
  const playAudio = async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return;

    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:');
      console.error(formatError(error));
      
      // Don't show toast for audio errors as they're not critical and happen frequently
      // The conversation can continue without audio playback
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (realtimeClientRef.current) {
        realtimeClientRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const isSetupComplete = () => {
    return (
      setup.rubricFile &&
      setup.nativeLanguage &&
      setup.learningLanguage &&
      setup.conversationPrompt.trim() &&
      setup.classLevel
    );
  };

  const startConversation = async () => {
    if (!isSetupComplete()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsConnecting(true);

    try {
      // Initialize audio context
      await initializeAudio();

      // Extract rubric text if provided
      const rubricContent = setup.rubricFile ? await extractRubricText(setup.rubricFile) : '';

      // Configure the session through our API with timeout
      console.log('Making request to /api/realtime with payload:', {
        classLevel: setup.classLevel,
        conversationPrompt: setup.conversationPrompt.substring(0, 50) + '...',
        learningLanguage: setup.learningLanguage,
        hasRubricContent: !!rubricContent
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let configResponse;
      try {
        configResponse = await fetch('/api/realtime', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classLevel: setup.classLevel,
            conversationPrompt: setup.conversationPrompt,
            learningLanguage: setup.learningLanguage,
            rubricContent,
          }),
          signal: controller.signal
        });
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout: The server took too long to respond. Please try again.');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!configResponse.ok) {
        let errorText = '';
        try {
          errorText = await configResponse.text();
        } catch (e) {
          errorText = 'Unable to read error response';
        }
        
        console.error('API response error:');
        console.error(`Status: ${configResponse.status} ${configResponse.statusText}`);
        console.error('Response body:', errorText);
        console.error('Request URL:', '/api/realtime');
        
        throw new Error(`API request failed: ${configResponse.status} ${configResponse.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }

      const configData = await configResponse.json();
      if (!configData.success || !configData.sessionConfig) {
        throw new Error('Invalid response from API: missing sessionConfig');
      }

      const { sessionConfig } = configData;

      // Validate environment variables
      if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        console.error('Missing NEXT_PUBLIC_OPENAI_API_KEY environment variable');
        toast.error("OpenAI API key not configured. Please check your environment variables.");
        throw new Error('OpenAI API key not found');
      }

      console.log('Environment validation passed. Initializing realtime client...');

      const client = new RealtimeClient(process.env.NEXT_PUBLIC_OPENAI_API_KEY);

      // Set up event handlers
      client.onConnected = () => {
        setIsConnecting(false);
        setIsConversationActive(true);
        toast.success("Connected! The AI will speak in " + setup.learningLanguage.charAt(0).toUpperCase() + setup.learningLanguage.slice(1));
      };

      client.onDisconnected = () => {
        setIsConversationActive(false);
        setIsRecording(false);
        setTranscript([]);
        toast.success("Conversation ended.");
      };

      client.onError = (error) => {
        console.error('Realtime client error occurred:');
        console.error(formatError(error));
        
        // Provide more specific error messages based on error content
        const errorMessage = error instanceof Error 
          ? error.message 
          : "Connection error. Please try again.";
        
        toast.error(errorMessage);
        setIsConversationActive(false);
        setIsConnecting(false);
      };

      client.onAudioReceived = (audioData) => {
        playAudio(audioData);
      };

      client.onTranscriptionReceived = (text, isUser) => {
        setTranscript(prev => [...prev, { text, isUser }]);
      };

      realtimeClientRef.current = client;

      // Initialize the connection
      const success = await client.initialize(sessionConfig);
      if (!success) {
        throw new Error('Failed to initialize realtime client');
      }

    } catch (error) {
      console.error('Error starting conversation:');
      console.error(formatError(error));
      
      // Provide more specific error message based on error content
      let errorMessage = "Failed to start conversation. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('API request failed')) {
          errorMessage = "Failed to configure conversation. Please check your connection and try again.";
        } else if (error.message.includes('API key')) {
          errorMessage = "API key configuration error. Please check your settings.";
        } else if (error.message.includes('WebSocket')) {
          errorMessage = "Connection error. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
      setIsConversationActive(false);
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    if (realtimeClientRef.current) {
      realtimeClientRef.current.disconnect();
      realtimeClientRef.current = null;
    }
    setIsConversationActive(false);
    setIsRecording(false);
    setTranscript([]);
    toast.success("Conversation ended.");
  };

  const toggleRecording = async () => {
    if (!realtimeClientRef.current) return;

    if (isRecording) {
      realtimeClientRef.current.stopRecording();
      setIsRecording(false);
    } else {
      const success = await realtimeClientRef.current.startRecording();
      if (success) {
        setIsRecording(true);
      } else {
        toast.error("Failed to start recording. Please check microphone permissions.");
      }
    }
  };

  if (isConversationActive) {
  return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white border border-gray-300 rounded-xl p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-black mb-2">
                {setup.learningLanguage.charAt(0).toUpperCase() + setup.learningLanguage.slice(1)} Conversation
              </h1>
              <div className="text-sm text-black">
                <div className="mb-1">Level: {classLevelOptions.find(c => c.value === setup.classLevel)?.label}</div>
                <div>Topic: {setup.conversationPrompt}</div>
              </div>
            </div>
            
            {/* Recording Controls */}
            <div className="flex items-center justify-center gap-4 mb-8 p-6 bg-gray-100 rounded-xl border">
              <button
                onClick={toggleRecording}
                className={`p-4 rounded-full shadow-md transition-all ${
                  isRecording 
                    ? "bg-red-500 hover:bg-red-600 text-white ring-4 ring-red-100" 
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
                title={isRecording ? "Stop recording" : "Start recording"}
              >
                {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              <span className="text-sm font-medium text-black">
                {isRecording ? "Recording... Click to stop" : "Click to start speaking"}
              </span>
            </div>

            {/* Conversation Area */}
            <div className="bg-gray-100 rounded-xl p-6 mb-8 h-[400px] overflow-y-auto border">
              {transcript.length === 0 ? (
                <div className="flex items-center justify-center h-full text-black">
                  Start speaking to begin the conversation...
                </div>
              ) : (
                <div className="space-y-4">
                  {transcript.map((entry, index) => (
                    <div
                      key={index}
                      className={`flex ${entry.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] rounded-xl p-4 shadow-sm ${
                          entry.isUser
                            ? "bg-orange-500 text-white"
                            : "bg-white border border-gray-300"
                        }`}
                      >
                        <div className={`text-xs mb-1 ${entry.isUser ? 'text-orange-100' : 'text-black'}`}>
                          {entry.isUser ? "You" : "AI Tutor"}
                        </div>
                        <div className="text-sm leading-relaxed">{entry.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* End Button */}
            <div className="flex justify-center">
              <button
                onClick={endConversation}
                className="bg-gray-200 hover:bg-gray-300 text-black px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium border"
              >
                <Square size={16} />
                <span>End Conversation</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white border border-gray-300 rounded-xl p-8">
          <h1 className="text-2xl font-semibold text-black mb-12 text-center">Language Learning Platform</h1>
          
          <div className="space-y-8">
            {/* Rubric Upload */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Upload Rubric (PDF) *</label>
              <div className="border-2 border-dashed border-gray-400 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="rubric-upload"
                />
                <label
                  htmlFor="rubric-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <Upload className="h-8 w-8 text-black" />
                  <span className="text-sm text-black text-center">
                    {setup.rubricFile ? setup.rubricFile.name : "Click to upload PDF rubric"}
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Native Language */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Native Language *</label>
                <select
                  value={setup.nativeLanguage}
                  onChange={(e) => setSetup({ ...setup, nativeLanguage: e.target.value as Language })}
                  className="w-full p-3 border border-gray-400 rounded-lg bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-colors text-black"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Learning Language */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">Learning Language *</label>
                <select
                  value={setup.learningLanguage}
                  onChange={(e) => setSetup({ ...setup, learningLanguage: e.target.value as Language })}
                  className="w-full p-3 border border-gray-400 rounded-lg bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-colors text-black"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Class Level */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Class Level *</label>
              <select
                value={setup.classLevel}
                onChange={(e) => setSetup({ ...setup, classLevel: e.target.value as ClassLevel })}
                className="w-full p-3 border border-gray-400 rounded-lg bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-colors text-black"
              >
                {classLevelOptions.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
              <div className="text-sm text-black mt-2 bg-gray-50 p-3 rounded-lg border">
                {classLevelOptions.find(c => c.value === setup.classLevel)?.description}
              </div>
            </div>

            {/* Conversation Prompt */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">Conversation Prompt *</label>
              <textarea
                value={setup.conversationPrompt}
                onChange={(e) => setSetup({ ...setup, conversationPrompt: e.target.value })}
                placeholder="Enter a prompt to guide the conversation (e.g., 'Let's talk about travel and vacations')"
                rows={3}
                className="w-full p-3 border border-gray-400 rounded-lg bg-white focus:ring-2 focus:ring-orange-100 focus:border-orange-500 transition-colors resize-none text-black"
              />
            </div>

            {/* Start Button */}
            <div className="pt-6">
              <button
                onClick={startConversation}
                disabled={!isSetupComplete() || isConnecting}
                className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-medium transition-all border ${
                  isSetupComplete() && !isConnecting
                    ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg"
                    : "bg-gray-200 text-gray-600 cursor-not-allowed border-gray-300"
                }`}
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-orange-200 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    <span>Begin Conversation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
