# Language Learning Platform

An AI-powered language learning platform that enables real-time conversations with adaptive difficulty based on student proficiency levels.

## Features

- **Multi-language Support**: Practice Spanish, French, Vietnamese, or English
- **Adaptive Difficulty**: AI adjusts complexity based on class level and student responses
- **Real-time Voice Conversations**: Powered by OpenAI's Realtime API
- **Rubric Integration**: Upload PDF rubrics to guide conversation assessment
- **Class Level Mapping**: Supports ACTFL proficiency standards from Novice to Advanced
- **Real-time Transcription**: See both student and AI responses in text format

## Getting Started

### Prerequisites

- Node.js 18+ installed
- OpenAI API key with access to the Realtime API

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Edit `.env.local` and add your OpenAI API key.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## How to Use

### Setup Phase
1. **Upload Rubric**: Upload a PDF rubric (optional) to guide conversation assessment
2. **Select Native Language**: Choose your native language for instructions (default: English)
3. **Select Learning Language**: Choose the language you want to practice
4. **Choose Class Level**: Select your proficiency level:
   - Classes 1-2: Novice Low-High
   - Classes 3-4: Intermediate Low-Mid
   - Classes 5-6: Intermediate Mid-High
   - Classes 7-8 Honors: Advanced Low
   - AP Language: Advanced Mid-High
   - AP Literature: Advanced High-Superior
5. **Enter Conversation Prompt**: Provide a topic to guide the conversation

### Conversation Phase
1. Click "Begin Conversation" to start
2. Click the microphone button to start speaking
3. The AI will respond in your target language, adjusting complexity based on your level
4. Continue the conversation naturally
5. Click "End Conversation" when finished

## Technical Architecture

- **Frontend**: React with Next.js and TypeScript
- **Styling**: Tailwind CSS
- **API Integration**: OpenAI Realtime API for voice conversations
- **Audio Processing**: Web Audio API for real-time audio handling
- **State Management**: React hooks and context

## Class Level Mapping

The platform maps class levels to ACTFL proficiency standards:

- **Novice (Classes 1-2)**: Simple words and phrases, basic needs
- **Intermediate Low-Mid (Classes 3-4)**: Sentence strings, everyday topics
- **Intermediate Mid-High (Classes 5-6)**: Connected discourse, multiple time frames
- **Advanced Low (Classes 7-8)**: Sustained conversations, explanations
- **Advanced Mid-High (AP Language)**: Extended discourse, abstract topics
- **Advanced High-Superior (AP Literature)**: Cultural analysis, persuasive arguments

## Notes

- This is a demo implementation focused on core functionality
- PDF parsing is simplified (returns filename only)
- For production use, implement proper API key security
- The platform adapts in real-time based on student responses
- Supports microphone permissions and audio playback

## Requirements Met

✅ Simple, functional interface
✅ Rubric PDF upload
✅ Language selection (native + learning)
✅ Class level selection with ACTFL mapping
✅ Conversation prompt input
✅ OpenAI Realtime API integration
✅ Adaptive conversation difficulty
✅ Real-time voice conversation
✅ Begin/end conversation controls
✅ No backend database required
✅ No authentication required