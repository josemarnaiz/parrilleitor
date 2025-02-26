import Anthropic from '@anthropic-ai/sdk'
import { IAIProvider } from './IAIProvider'

export class AnthropicProvider extends IAIProvider {
  constructor() {
    super()
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }

  async getCompletion(message, systemPrompt) {
    const response = await this.client.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `${systemPrompt}\n\nUser: ${message}`
        }
      ]
    })

    return response.content[0].text
  }
} 