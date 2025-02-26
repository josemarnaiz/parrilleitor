import { getSession } from '@auth0/nextjs-auth0'
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

export async function POST(request) {
  try {
    const session = await getSession()
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { message } = await request.json()
    const aiProvider = AIProviderFactory.getProvider()
    const response = await aiProvider.getCompletion(message, SYSTEM_PROMPT)

    return new Response(
      JSON.stringify({ message: response }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 