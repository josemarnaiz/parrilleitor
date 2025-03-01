import OpenAI from 'openai'
import { IAIProvider } from './IAIProvider'

export class OpenAIProvider extends IAIProvider {
  constructor() {
    super()
    try {
      // Verificar que la API key esté configurada
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY no está configurada en las variables de entorno')
      }
      
      // Inicializar el cliente con timeout y manejo de errores mejorado
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 60000, // 60 segundos de timeout
        maxRetries: 3, // Intentar hasta 3 veces
      })
      
      console.log('Cliente OpenAI inicializado correctamente')
    } catch (error) {
      console.error('Error al inicializar el cliente OpenAI:', error)
      throw new Error(`Error al inicializar OpenAI: ${error.message}`)
    }
  }

  /**
   * Método principal para obtener respuesta del modelo
   * Este método es llamado desde el API de chat
   */
  async getResponse(messages) {
    try {
      console.log('Solicitando respuesta a OpenAI con', messages.length, 'mensajes')
      
      // Verificar que los mensajes tengan el formato correcto
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('El formato de mensajes es inválido')
      }
      
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7,
        max_tokens: 800,
      })
      
      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('OpenAI no devolvió respuestas válidas')
      }
      
      console.log('Respuesta de OpenAI recibida correctamente')
      return completion.choices[0].message.content
    } catch (error) {
      console.error('Error al obtener respuesta de OpenAI:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
      
      // Proporcionar mensajes de error más descriptivos
      if (error.message.includes('timeout')) {
        throw new Error('La solicitud a OpenAI excedió el tiempo de espera. Por favor, inténtalo de nuevo.')
      } else if (error.message.includes('API key')) {
        throw new Error('Error de autenticación con OpenAI. Verifica la API key.')
      } else if (error.message.includes('rate limit')) {
        throw new Error('Se ha excedido el límite de solicitudes a OpenAI. Por favor, espera un momento e inténtalo de nuevo.')
      }
      
      throw new Error(`Error al procesar la solicitud: ${error.message}`)
    }
  }

  // Mantener el método getCompletion para compatibilidad
  async getCompletion(message, systemPrompt, conversationHistory = []) {
    // Preparar array de mensajes con el prompt del sistema y el historial
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ]

    return this.getResponse(messages)
  }
} 