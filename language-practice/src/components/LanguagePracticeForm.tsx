'use client';

import { useState } from 'react';

interface FormData {
  nativeLanguage: string;
  targetLanguage: string;
  conversationPrompt: string;
}

interface Props {
  onStartConversation: (data: FormData) => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
];

export default function LanguagePracticeForm({ onStartConversation }: Props) {
  const [formData, setFormData] = useState<FormData>({
    nativeLanguage: '',
    targetLanguage: '',
    conversationPrompt: ''
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Partial<FormData> = {};
    if (!formData.nativeLanguage) newErrors.nativeLanguage = 'Please select your native language';
    if (!formData.targetLanguage) newErrors.targetLanguage = 'Please select the language you want to practice';
    if (!formData.conversationPrompt.trim()) newErrors.conversationPrompt = 'Please enter a conversation prompt';
    if (formData.nativeLanguage === formData.targetLanguage) {
      newErrors.targetLanguage = 'Target language must be different from native language';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onStartConversation(formData);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-semibold text-black mb-6">
        Set up your practice session
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Your Native Language (for instructions)
          </label>
          <select
            value={formData.nativeLanguage}
            onChange={(e) => handleInputChange('nativeLanguage', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black ${
              errors.nativeLanguage ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select your native language...</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
          {errors.nativeLanguage && (
            <p className="mt-1 text-sm text-red-600">{errors.nativeLanguage}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Language to Practice
          </label>
          <select
            value={formData.targetLanguage}
            onChange={(e) => handleInputChange('targetLanguage', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black ${
              errors.targetLanguage ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select language to practice...</option>
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
          {errors.targetLanguage && (
            <p className="mt-1 text-sm text-red-600">{errors.targetLanguage}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Conversation Topic/Prompt
          </label>
          <textarea
            value={formData.conversationPrompt}
            onChange={(e) => handleInputChange('conversationPrompt', e.target.value)}
            placeholder="Enter the topic or prompt from your language class. For example: 'Talking about your favorite foods and restaurants' or 'Discussing weekend plans and hobbies'"
            rows={4}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder:text-black ${
              errors.conversationPrompt ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.conversationPrompt && (
            <p className="mt-1 text-sm text-red-600">{errors.conversationPrompt}</p>
          )}
          <p className="mt-1 text-xs text-black">
            The AI will use this prompt to guide the conversation and adjust vocabulary to your level
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Begin Conversation
        </button>
      </form>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> The AI will start a conversation based on your prompt, 
          listen to your responses, and automatically adjust its speaking speed and vocabulary 
          complexity based on your demonstrated proficiency level.
        </p>
      </div>
    </div>
  );
}
