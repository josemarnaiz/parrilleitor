import OpenAI from 'openai'
import { IAIProvider } from './IAIProvider'

export class OpenAIProvider extends IAIProvider {
  constructor() {
    super()
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async getCompletion(message, systemPrompt, conversationHistory = []) {
    // Prepare messages array with system prompt and history
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ]

    const completion = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0].message.content
  }
} 