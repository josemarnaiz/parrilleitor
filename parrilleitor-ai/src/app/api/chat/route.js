import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0'
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

async function handler(request) {
  try {
    const session = await getSession(request)
    
    if (!session) {
      console.error('No session found in chat API')
      console.log('Request headers:', Object.fromEntries(request.headers))
      return new Response(JSON.stringify({ error: 'No session found' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!session.user) {
      console.error('No user found in session')
      return new Response(JSON.stringify({ error: 'No user found in session' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { message } = await request.json()
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const aiProvider = AIProviderFactory.getProvider()
    const response = await aiProvider.getCompletion(message, SYSTEM_PROMPT)

    return new Response(JSON.stringify({ message: response }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in chat route:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        type: error.constructor.name
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

export const POST = withApiAuthRequired(handler) 