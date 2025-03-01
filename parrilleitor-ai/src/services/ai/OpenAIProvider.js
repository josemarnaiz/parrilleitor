import OpenAI from 'openai'
import { IAIProvider } from './IAIProvider'

export class OpenAIProvider extends IAIProvider {
  constructor() {
    super()
    try {
      // Verificar que la API key esté configurada
      if (!process.env.OPENAI_API_KEY) {
        console.error('OPENAI_API_KEY no está configurada en las variables de entorno')
      } else {
        // Mostrar los primeros 5 caracteres de la API key para verificar que está cargada correctamente
        console.log(`OPENAI_API_KEY configurada correctamente (comienza con: ${process.env.OPENAI_API_KEY.substring(0, 5)}...)`)
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
      
      // Log detallado de los mensajes que se envían a OpenAI
      console.log('Contenido de los mensajes enviados a OpenAI:', 
        messages.map(m => ({ role: m.role, content_length: m.content.length, content_preview: m.content.substring(0, 50) + '...' }))
      )
      
      // Verificar que los mensajes tengan el formato correcto
      if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('El formato de mensajes es inválido')
      }
      
      console.log('Enviando solicitud a OpenAI API...')
      
      // Reducir el número de tokens y la temperatura para obtener respuestas más rápidas
      const completion = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo", // Usar gpt-3.5-turbo que es más rápido
        messages: messages,
        temperature: 0.5, // Reducir temperatura para respuestas más deterministas
        max_tokens: 500, // Reducir tokens para respuestas más cortas y rápidas
        // El parámetro timeout no es soportado en la API de chat.completions.create
        // y estaba causando el error 400
      })
      
      console.log('Respuesta recibida de OpenAI API')
      
      if (!completion.choices || completion.choices.length === 0) {
        console.error('OpenAI devolvió una respuesta sin choices:', completion)
        throw new Error('OpenAI no devolvió respuestas válidas')
      }
      
      const responseContent = completion.choices[0].message.content
      
      // Log detallado de la respuesta recibida
      console.log('Respuesta de OpenAI recibida correctamente:', {
        content_length: responseContent.length,
        content_preview: responseContent.substring(0, 100) + '...',
        finish_reason: completion.choices[0].finish_reason,
        model: completion.model,
        usage: completion.usage
      })
      
      return responseContent
    } catch (error) {
      console.error('Error al obtener respuesta de OpenAI:', {
        error: error.message,
        name: error.name,
        status: error.status,
        stack: error.stack,
        timestamp: new Date().toISOString()
      })
      
      // Si es un error de la API de OpenAI, mostrar más detalles
      if (error.response) {
        console.error('Detalles del error de OpenAI API:', {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        })
      }
      
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