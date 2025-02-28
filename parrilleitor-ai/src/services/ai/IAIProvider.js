/**
 * Interface for AI Providers
 * @interface
 */
export class IAIProvider {
  /**
   * @param {string} message - The user's message
   * @param {string} systemPrompt - The system prompt to guide the AI
   * @param {Array<{role: string, content: string}>} conversationHistory - Previous messages in the conversation
   * @returns {Promise<string>} The AI's response
   */
  async getCompletion(message, systemPrompt, conversationHistory = []) {
    throw new Error('Method not implemented')
  }
} 