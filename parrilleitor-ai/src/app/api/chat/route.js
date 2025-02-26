import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0/edge'
import { AIProviderFactory } from '@/services/ai/AIProviderFactory'
import { isInAllowedList } from '@/config/allowedUsers'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

const SYSTEM_PROMPT = `You are an AI agent EXCLUSIVELY specialized in sports nutrition and physical exercise. Your purpose is to provide personalized advice on:

ALLOWED AREAS:
1. Sports nutrition and meal planning
2. Exercise routines and training programs
3. Basic sports supplementation
4. Muscle recovery and rest
5. Sports hydration
6. Training periodization
7. Fitness goals (fat loss, muscle gain, performance)

STRICT RULES:
1. IMMEDIATELY REJECT any question outside these areas
2. If the question is not related to sports nutrition or exercise, respond in the same language as the user's question with an appropriate rejection message
3. DO NOT give medical advice or address health issues requiring medical attention
4. DO NOT recommend medications or medical treatments
5. DO NOT give advice about injuries or rehabilitation
6. For any medical concerns, recommend consulting a healthcare professional

RESPONSE GUIDELINES:
1. Be specific and practical in your recommendations
2. Always explain the reasoning behind your advice
3. Prioritize user safety and well-being
4. Maintain a professional and motivating tone
5. Focus on healthy and sustainable practices
6. Include warnings when necessary
7. Request more information if needed for an appropriate response

LANGUAGE GUIDELINES:
1. ALWAYS respond in the same language as the user's question
2. For Spanish: "Lo siento, solo puedo ayudarte con temas de nutrición deportiva y ejercicio físico."
3. For English: "I apologize, but I can only assist you with sports nutrition and exercise-related topics."
4. For Portuguese: "Desculpe, só posso ajudar com tópicos relacionados à nutrição esportiva e exercícios."
5. For other languages, respond in that language if you can, or default to English

If you are not 100% certain that a question falls within your area of expertise, REJECT IT and suggest consulting with an appropriate professional, using the same language as the user's question.`

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
    
    // Verificar acceso premium por ambos métodos
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)
    const isAllowedUser = isInAllowedList(userEmail)

    // Debugging
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

    const aiProvider = AIProviderFactory.getProvider()
    const response = await aiProvider.getCompletion(message, SYSTEM_PROMPT)

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

export const POST = withApiAuthRequired(handler)

export const runtime = 'edge' 