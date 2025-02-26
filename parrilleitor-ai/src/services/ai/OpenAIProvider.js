import OpenAI from 'openai'
import { IAIProvider } from './IAIProvider'

export class OpenAIProvider extends IAIProvider {
  constructor() {
    super()
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async getCompletion(message, systemPrompt) {
    const completion = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return completion.choices[0].message.content
  }
} 