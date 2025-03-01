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
      
      // Inicializar el cliente con timeout reducido para evitar FUNCTION_INVOCATION_TIMEOUT en Vercel
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 25000, // 25 segundos de timeout (reducido para evitar timeout en Vercel)
        maxRetries: 2, // Reducir a 2 reintentos para evitar exceder el tiempo total
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
      
      // Reducir el número de tokens y la temperatura para obtener respuestas más rápidas
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Usar gpt-3.5-turbo que es más rápido
        messages: messages,
        temperature: 0.5, // Reducir temperatura para respuestas más deterministas
        max_tokens: 500, // Reducir tokens para respuestas más cortas y rápidas
        // El parámetro timeout no es soportado en la API de chat.completions.create
        // y estaba causando el error 400
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
        return "Lo siento, la solicitud a OpenAI excedió el tiempo de espera. Por favor, intenta enviar un mensaje más corto o inténtalo de nuevo más tarde."
      } else if (error.message.includes('API key')) {
        return "Error de autenticación con OpenAI. Por favor, contacta al administrador para verificar la configuración de la API key."
      } else if (error.message.includes('rate limit')) {
        return "Se ha excedido el límite de solicitudes a OpenAI. Por favor, espera un momento e inténtalo de nuevo."
      } else if (error.message.includes('project')) {
        return "Hay un problema con la clave de proyecto de OpenAI. Por favor, contacta al administrador para verificar la configuración."
      }
      
      // En lugar de lanzar un error, devolver un mensaje amigable
      return `Lo siento, ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde. (${error.message.substring(0, 100)}...)`
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