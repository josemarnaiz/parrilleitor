import { OpenAIProvider } from './OpenAIProvider'
import { AnthropicProvider } from './AnthropicProvider'

export class AIProviderFactory {
  static getProvider(type = process.env.AI_PROVIDER || 'openai') {
    switch (type.toLowerCase()) {
      case 'anthropic':
        return new AnthropicProvider()
      case 'openai':
      default:
        return new OpenAIProvider()
    }
  }
} 