We are building a platform for practicing a foreign language. The learner needs to be able select their native language and the language they're trying to learn. The native language is for the directions for the learner graphically on the frontend, and the language they are learning is for the AI to respond and listen to students while engaging in the conversation. The user should input a conversation prompt from the angiage class they're taking that the LLM will use to respond and guide the conversation. It is important that the LLM uses vocabulary and grammer concepts from this prompt, and it should be an input value for the realtime openai voice api.

Once all of this is inputted by the user (no optional fields), it will establish an instance with OpenAI's Realtime API for speaking with the input language. This is how ChatGPT should interact with the user in the realtime API instance. The API instance/conversation is started by a "begin conversation" button on the frontend. The frontend should look like a YC startup MVP just before it gets accepted into the batch; scrapy, simple, but extremly useful and likely to go viral:
When the conversation is started, the LLM will initiate a conversation that is aligned with the input conversational prompt. The learner will now speak back as if in normal conversation in language they're learning, and the conversation will continue. If the student is less advanced, LLM should speak slowly, use more forma academic language that's likely included in the textbook, talk slower, maybe with a slightly less advanced langiage acwuitison accent, maybe emphasize the syallables. Conversley, if the student is advanced, maybe the LLM can speak faster, use a more advanced vocabulary, use slang, etc. Based on the quality of the response and demonstrated comprehension from the student, the LLM should adjust the level that it responds in realtime. The learner will continue the coversation until they press end conversation, then instance is over. This logic to adjust the level of the LLM responses should only be included in our system prompt right now. We will add additional logic later on, but for now, keep it simple. 

Tech stack: Correct Architecture
Backend (FastAPI) - 3 Simple Routes
POST /api/generate-token
python# Generate ephemeral token for Realtime API session
# Input: conversation_prompt, target_language, native_language, student_level
# Output: ephemeral_token, expires_in
WebSocket /ws/realtime
python# Proxy WebSocket connection to OpenAI Realtime API
# Handles authentication with ephemeral token
# Forwards audio data bidirectionally
POST /api/end-session (optional)
python# Clean up session if needed
# Log conversation metadata
Frontend (React/Next.js) Flow

Setup Form: User selects native language, target language, inputs conversation prompt
Token Request: Frontend calls /api/generate-token with user inputs
WebSocket Connection: Frontend connects to /ws/realtime using received token
Audio Streaming: Bidirectional audio streaming through WebSocket proxy
Conversation: Real-time voice conversation with adaptive difficulty
End Session: User clicks "End Conversation", WebSocket closes

Key Implementation Details
System Prompt Construction: Backend builds dynamic system prompt including:

Target language for responses
Conversation prompt context
Adaptive difficulty instructions
Grammar/vocabulary focus areas

Audio Handling: Frontend captures microphone → sends to backend WebSocket → forwards to OpenAI → receives response → plays audio
Adaptive Difficulty: System prompt instructs LLM to adjust complexity based on student responses in real-time
Session Management: Each conversation gets unique ephemeral token, expires after use
This architecture keeps it simple (3 backend endpoints) while being secure and scalable. The FastAPI backend acts as a secure proxy, and your Next.js frontend handles all the UI and audio processing.
Would you like me to create the complete implementation with both FastAPI backend routes and React frontend components?
Model name: gpt-realtime-2025-08-28
Consult @https://platform.openai.com/docs/guides/voice-agents?voice-agent-architecture=speech-to-speech to understand how to use the OpenAI Realtime API to build this voice agent.

Remember you are building the foundation for a SaaS product that will be expanded upon. Therefore, this implementation should be simple and easy to build off of but also able to support our future needs.

