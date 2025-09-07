'use client';

import { useState } from 'react';
import LanguagePracticeForm from '@/components/LanguagePracticeForm';
import ConversationInterface from '@/components/ConversationInterface';

export default function Home() {
  const [conversationStarted, setConversationStarted] = useState(false);
  const [formData, setFormData] = useState({
    nativeLanguage: '',
    targetLanguage: '',
    conversationPrompt: ''
  });

  const handleStartConversation = (data: typeof formData) => {
    setFormData(data);
    setConversationStarted(true);
  };

  const handleEndConversation = () => {
    setConversationStarted(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            SpeakEasy
          </h1>
          <p className="text-lg text-black mb-1">
            AI-powered language conversation practice
          </p>
          <p className="text-sm text-black">
            Practice speaking with an AI that adapts to your level
          </p>
        </div>

        {!conversationStarted ? (
          <LanguagePracticeForm onStartConversation={handleStartConversation} />
        ) : (
          <ConversationInterface 
            formData={formData}
            onEndConversation={handleEndConversation}
          />
        )}
        
        <div className="mt-8 text-center">
          <p className="text-xs text-black">
            Built with Next.js and OpenAI Realtime API
          </p>
        </div>
      </div>
    </div>
  );
}
