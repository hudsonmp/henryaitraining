import { NextRequest } from 'next/server';

// Class level to proficiency mapping
const PROFICIENCY_LEVELS = {
  '1-2': {
    level: 'novice',
    description: 'Novice Low-High',
    instructions: 'Speak very slowly and clearly. Use simple, basic vocabulary that would be found in beginner textbooks. Use short sentences. Emphasize pronunciation of syllables. Use more formal, academic language. Avoid idioms or colloquialisms.'
  },
  '3-4': {
    level: 'intermediate-low',
    description: 'Intermediate Low-Mid',
    instructions: 'Speak at a moderate pace. Use vocabulary and sentence structures appropriate for intermediate learners. Ask simple questions and encourage responses. Use everyday topics and situations.'
  },
  '5-6': {
    level: 'intermediate-mid',
    description: 'Intermediate Mid-High',
    instructions: 'Speak at a normal pace. Use more complex sentence structures and varied vocabulary. Introduce different time frames in conversation. Connect ideas and encourage longer responses.'
  },
  '7-8': {
    level: 'advanced-low',
    description: 'Advanced Low',
    instructions: 'Speak at a natural pace. Use advanced vocabulary and complex sentence structures. Encourage explanations and opinions. Discuss abstract topics and current events.'
  },
  'ap-language': {
    level: 'advanced-mid',
    description: 'Advanced Mid-High',
    instructions: 'Speak at a natural, fluent pace. Use sophisticated vocabulary and advanced grammar structures. Discuss complex abstract topics. Encourage detailed analysis and extended discourse.'
  },
  'ap-literature': {
    level: 'advanced-high',
    description: 'Advanced High-Superior',
    instructions: 'Speak naturally with native-like fluency. Use advanced, nuanced vocabulary. Discuss literature, cultural topics, and complex abstract concepts. Encourage persuasive arguments and cultural analysis.'
  }
};

export async function POST(request: NextRequest) {
  console.log('[POST /api/realtime] Request received');
  
  try {
    // Validate environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('[POST /api/realtime] Missing OPENAI_API_KEY environment variable');
      return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const body = await request.json();
    console.log('[POST /api/realtime] Request body received:', {
      hasClassLevel: !!body.classLevel,
      hasConversationPrompt: !!body.conversationPrompt,
      hasLearningLanguage: !!body.learningLanguage,
      hasRubricContent: !!body.rubricContent,
      classLevel: body.classLevel,
      learningLanguage: body.learningLanguage
    });

    const { classLevel, conversationPrompt, learningLanguage, rubricContent } = body;

    // Validate required fields
    if (!classLevel || !conversationPrompt || !learningLanguage) {
      console.error('[POST /api/realtime] Missing required fields:', {
        classLevel: !!classLevel,
        conversationPrompt: !!conversationPrompt,
        learningLanguage: !!learningLanguage
      });
      return Response.json({ 
        error: 'Missing required fields: classLevel, conversationPrompt, and learningLanguage are required' 
      }, { status: 400 });
    }

    // Get proficiency level instructions
    const proficiency = PROFICIENCY_LEVELS[classLevel as keyof typeof PROFICIENCY_LEVELS];
    
    if (!proficiency) {
      console.error('[POST /api/realtime] Invalid class level:', classLevel);
      console.error('Valid class levels:', Object.keys(PROFICIENCY_LEVELS));
      return Response.json({ 
        error: `Invalid class level: ${classLevel}. Valid options are: ${Object.keys(PROFICIENCY_LEVELS).join(', ')}` 
      }, { status: 400 });
    }

    console.log('[POST /api/realtime] Using proficiency level:', {
      level: proficiency.level,
      description: proficiency.description
    });
    
    // Create system instructions based on class level and rubric
    const systemInstructions = `You are an AI language tutor helping a student learn ${learningLanguage}. 

PROFICIENCY LEVEL: ${proficiency.description}
SPEAKING GUIDELINES: ${proficiency.instructions}

CONVERSATION TOPIC: ${conversationPrompt}

RUBRIC CONTEXT: ${rubricContent ? 'Assess responses based on the provided rubric and adjust complexity accordingly.' : 'No rubric provided - use class level as primary guide.'}

ADAPTIVE BEHAVIOR:
- Start at the indicated proficiency level
- Listen carefully to student responses to gauge actual ability
- If student struggles, simplify language and speak more slowly
- If student excels, gradually increase complexity and pace
- Always respond in ${learningLanguage}
- Provide gentle corrections when needed
- Keep the conversation engaging and educational

Begin the conversation by greeting the student in ${learningLanguage} and introducing the topic: "${conversationPrompt}"`;

    // Determine voice based on language
    const voiceMapping: { [key: string]: string } = {
      'spanish': 'alloy',
      'french': 'shimmer', 
      'vietnamese': 'nova',
      'english': 'echo'
    };
    
    const selectedVoice = voiceMapping[learningLanguage] || 'echo';
    
    console.log('[POST /api/realtime] Generated session configuration:', {
      instructionsLength: systemInstructions.length,
      selectedVoice,
      learningLanguage
    });

    // Return the session configuration for the frontend
    const sessionConfig = {
      instructions: systemInstructions,
      voice: selectedVoice,
      language: learningLanguage,
      turn_detection: {
        type: 'server_vad',
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      input_audio_format: 'pcm16',
      output_audio_format: 'pcm16',
      input_audio_transcription: {
        model: 'whisper-1',
      },
    };

    console.log('[POST /api/realtime] Successfully created session configuration');
    return Response.json({
      success: true,
      sessionConfig
    });

  } catch (error: any) {
    console.error('[POST /api/realtime] Unexpected error occurred:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle specific error types
    if (error.name === 'SyntaxError') {
      return Response.json({ 
        error: 'Invalid request format: Unable to parse JSON body' 
      }, { status: 400 });
    }
    
    return Response.json({ 
      error: error.message || 'Failed to configure session' 
    }, { status: 500 });
  }
}
