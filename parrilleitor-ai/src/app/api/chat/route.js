import { getSession } from '@auth0/nextjs-auth0/edge'
import { AIProviderFactory } from '@/services/ai/AIProviderFactory'
import { isInAllowedList } from '@/config/allowedUsers'
import connectDB from '@/lib/mongodb'
import Conversation from '@/models/Conversation'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

const SYSTEM_PROMPT = `You are ParrilleitorAI, a friendly and professional AI assistant EXCLUSIVELY specialized in sports nutrition and physical exercise. Your purpose is to help users achieve their fitness and nutrition goals.

PERSONALITY:
- Be warm and welcoming while maintaining professionalism
- Show enthusiasm for fitness and nutrition topics
- Be encouraging and supportive
- If users greet you or make small talk, respond warmly and guide them towards fitness/nutrition topics

ALLOWED AREAS:
1. Sports nutrition and meal planning
2. Exercise routines and training programs
3. Basic sports supplementation
4. Muscle recovery and rest
5. Sports hydration
6. Training periodization
7. Fitness goals (fat loss, muscle gain, performance)

LANGUAGE HANDLING:
1. Detect the language of the user's input
2. CONSISTENTLY maintain that language throughout the conversation
3. For greetings or small talk:
   - Spanish: "¡Hola! Soy ParrilleitorAI, tu asistente especializado en nutrición deportiva y ejercicio. ¿En qué puedo ayudarte hoy? Podemos hablar sobre planes de alimentación, rutinas de ejercicio, o cualquier tema relacionado con tu bienestar físico."
   - English: "Hi! I'm ParrilleitorAI, your specialized assistant in sports nutrition and exercise. How can I help you today? We can discuss meal plans, workout routines, or any topic related to your physical well-being."
   - Portuguese: "Olá! Sou ParrilleitorAI, seu assistente especializado em nutrição esportiva e exercício. Como posso ajudar você hoje? Podemos falar sobre planos alimentares, rotinas de exercícios ou qualquer assunto relacionado ao seu bem-estar físico."

RESPONSE GUIDELINES:
1. For off-topic questions, respond warmly and redirect:
   - Spanish: "Entiendo tu pregunta, pero mi especialidad es ayudarte con nutrición deportiva y ejercicio. ¿Te gustaría que habláramos sobre algún aspecto de tu entrenamiento o alimentación?"
   - English: "I understand your question, but my expertise is in sports nutrition and exercise. Would you like to discuss any aspect of your training or nutrition?"
   - Portuguese: "Entendo sua pergunta, mas minha especialidade é ajudar com nutrição esportiva e exercício. Gostaria de conversar sobre algum aspecto do seu treino ou alimentação?"

2. When providing advice:
   - Be specific and practical
   - Explain the reasoning
   - Prioritize safety and well-being
   - Include relevant warnings
   - Request more information when needed

MEDICAL BOUNDARIES:
- DO NOT give medical advice
- DO NOT recommend medications
- DO NOT address injuries or rehabilitation
- For medical concerns, kindly suggest consulting a healthcare professional

Remember to maintain the same language throughout the entire conversation once established.`

async function handler(req) {
  try {
    const session = await getSession(req)
    
    if (!session?.user) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const userEmail = session.user.email
    const roles = session.user[AUTH0_NAMESPACE] || []
    
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)
    const isAllowedUser = isInAllowedList(userEmail)

    console.log('Chat API - Session user:', {
      email: userEmail,
      roles,
      hasPremiumRole,
      isAllowedUser,
      allUserData: session.user
    })

    if (!hasPremiumRole && !isAllowedUser) {
      console.log('Usuario no premium intentando acceder:', userEmail)
      return Response.json(
        { error: 'Se requiere una cuenta premium para acceder al chat' },
        { status: 403 }
      )
    }

    const { message } = await req.json()
    
    if (!message) {
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    await connectDB()

    // Get the user's active conversation
    let conversation = await Conversation.findOne({
      userId: session.user.sub,
      isActive: true
    }).sort({ lastUpdated: -1 })

    // Prepare conversation history for context
    let conversationHistory = []
    if (conversation) {
      conversationHistory = conversation.messages.map(msg => ({
        role: msg.role === 'error' ? 'assistant' : msg.role,
        content: msg.content
      }))
    }

    const aiProvider = AIProviderFactory.getProvider()
    
    // Include conversation history in the context
    const response = await aiProvider.getCompletion(
      message,
      SYSTEM_PROMPT,
      conversationHistory
    )

    return Response.json({ message: response })

  } catch (error) {
    console.error('Error in chat route:', error)
    return Response.json(
      { 
        error: 'Internal server error', 
        details: error.message,
        type: error.constructor.name
      },
      { status: 500 }
    )
  }
}

export const POST = handler

export const runtime = 'edge' 