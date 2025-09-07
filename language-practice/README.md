# SpeakEasy - AI Language Practice Platform

A simple yet powerful language learning platform that uses OpenAI's Realtime API for real-time conversational practice. The AI adapts to your speaking level in real-time, providing an personalized learning experience.

## Features

- **Multi-language Support**: Practice 12 different languages including Spanish, French, German, Japanese, Korean, Chinese, and more
- **Adaptive AI**: The AI automatically adjusts its speaking speed, vocabulary complexity, and formality based on your demonstrated proficiency
- **Real-time Conversation**: Uses OpenAI's Realtime API for natural, flowing conversations
- **Topic-based Practice**: Input conversation prompts from your language classes for targeted practice
- **Simple Interface**: Clean, distraction-free design focused on conversation practice

## Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Styling**: Tailwind CSS
- **AI Integration**: OpenAI Realtime API (gpt-4o-realtime-preview)
- **Audio**: Web Audio API and MediaRecorder API
- **Communication**: WebSocket for real-time audio streaming

## Getting Started

### Prerequisites

1. Node.js (version 18 or higher)
2. OpenAI API key with access to the Realtime API

### Installation

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd language-practice
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Usage

1. **Select Languages**: Choose your native language (for UI instructions) and the target language you want to practice
2. **Enter Conversation Topic**: Input a conversation prompt or topic from your language class
3. **Begin Conversation**: Click "Begin Conversation" to start the AI-powered practice session
4. **Practice Speaking**: Hold the microphone button while speaking, release to send your audio
5. **Adaptive Learning**: The AI will automatically adjust its responses based on your demonstrated level
6. **End Session**: Click "End Conversation" when you're finished practicing

## How It Works

### Adaptive Difficulty System

The AI uses intelligent prompting to adjust its responses in real-time:

- **Beginner Level**: Slower speech, simpler vocabulary, formal academic language, emphasized syllables
- **Advanced Level**: Normal/faster pace, complex vocabulary, colloquialisms and slang, natural speech patterns

### Audio Processing

- Uses the browser's MediaRecorder API to capture audio
- Converts audio to the format required by OpenAI's Realtime API
- Streams audio in real-time for natural conversation flow
- Plays back AI responses through the Web Audio API

### Security

- API keys are securely stored server-side
- Ephemeral tokens are generated for each session
- No user data is stored permanently

## Supported Languages

- English
- Spanish (Español)
- French (Français)
- German (Deutsch)
- Italian (Italiano)
- Portuguese (Português)
- Russian (Русский)
- Japanese (日本語)
- Korean (한국어)
- Chinese/Mandarin (中文)
- Arabic (العربية)
- Hindi (हिन्दी)

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

Note: Requires microphone access for voice recording.

## Development

### Project Structure

```
src/
├── app/
│   ├── api/realtime-token/    # API route for token generation
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main page component
└── components/
    ├── ConversationInterface.tsx  # Real-time conversation UI
    └── LanguagePracticeForm.tsx   # Initial setup form
```

### API Routes

- `POST /api/realtime-token` - Generates ephemeral tokens for OpenAI Realtime API connections

## Deployment

This app can be easily deployed to Vercel, Netlify, or any platform that supports Next.js:

1. Set the `OPENAI_API_KEY` environment variable in your deployment platform
2. Deploy the application
3. Ensure your domain is configured properly for WebSocket connections

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this code for your own projects!

## Future Enhancements

- User authentication and progress tracking
- Conversation history and analytics
- Integration with language learning curricula
- Multi-modal practice (text + audio)
- Advanced pronunciation feedback
- Group conversation practice

---

Built with ❤️ using Next.js and OpenAI's Realtime API