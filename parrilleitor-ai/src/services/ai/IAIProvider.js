/**
 * Interface for AI Providers
 * @interface
 */
export class IAIProvider {
  /**
   * @param {string} message - The user's message
   * @param {string} systemPrompt - The system prompt to guide the AI
   * @returns {Promise<string>} The AI's response
   */
  async getCompletion(message, systemPrompt) {
    throw new Error('Method not implemented')
  }
} 