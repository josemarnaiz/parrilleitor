import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0/edge'
import { AIProviderFactory } from '@/services/ai/AIProviderFactory'

const SYSTEM_PROMPT = `You are an AI agent specializing in nutrition and sports. Your purpose is to provide personalized advice, tips, and diet recommendations to users based on their specific sport or daily exercise routines.

When providing advice, follow these guidelines:
1. Be specific and actionable in your recommendations
2. Consider the user's context and goals
3. Explain the reasoning behind your suggestions
4. Be encouraging and supportive
5. Focus on sustainable, healthy practices
6. Always prioritize user safety and well-being

Remember to maintain a friendly and professional tone.`

async function handler(req) {
  try {
    const session = await getSession(req)
    
    if (!session?.user) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
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