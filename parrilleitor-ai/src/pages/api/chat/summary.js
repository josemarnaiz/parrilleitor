import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import getMongoDBClient from '@/lib/mongodb';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// Common headers
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

// Nombre de la colección en MongoDB
const COLLECTION_NAME = 'conversations';

/**
 * Función para generar un resumen de la conversación
 * Utiliza un enfoque simple de extracción de información clave
 */
function generateConversationSummary(messages) {
  try {
    if (!messages || messages.length < 3) {
      return "No hay suficientes mensajes para generar un resumen.";
    }

    // Extraer preguntas del usuario (primeras 2-3 palabras de cada mensaje)
    const userQuestions = messages
      .filter(msg => msg.role === 'user')
      .map(msg => {
        const content = msg.content.trim();
        const words = content.split(' ');
        const firstWords = words.slice(0, Math.min(5, words.length)).join(' ');
        return firstWords + (words.length > 5 ? '...' : '');
      })
      .slice(0, 3); // Limitar a 3 preguntas principales

    // Extraer temas principales (basado en frecuencia de palabras)
    const allContent = messages
      .map(msg => msg.content.toLowerCase())
      .join(' ');
    
    // Palabras a excluir (stopwords)
    const stopwords = ['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero', 'si', 'no', 'por', 'para', 'con', 'sin', 'sobre', 'de', 'a', 'en', 'que', 'es', 'son', 'como', 'me', 'te', 'se', 'mi', 'tu', 'su', 'este', 'esta', 'estos', 'estas'];
    
    // Contar frecuencia de palabras
    const wordCounts = {};
    allContent
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.includes(word))
      .forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    
    // Encontrar las palabras más frecuentes
    const topWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Construir el resumen
    let summary = "";
    
    if (userQuestions.length > 0) {
      summary += "Se habló sobre: " + userQuestions.join(', ') + ". ";
    }
    
    if (topWords.length > 0) {
      summary += "Temas principales: " + topWords.join(', ') + ".";
    }
    
    return summary || "Conversación sobre fitness y nutrición.";
  } catch (error) {
    console.error('Error al generar resumen:', error);
    return "No se pudo generar un resumen.";
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  Object.entries(commonHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo permitir método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSession(req, res);

    if (!session?.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar acceso premium
    const roles = session.user[AUTH0_NAMESPACE] || [];
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(session.user.email);

    if (!hasPremiumRole && !isAllowedUser) {
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    const { conversationId, messages } = req.body;

    if (!conversationId || !messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Datos incompletos o formato incorrecto' });
    }

    // Generar el resumen
    const summary = generateConversationSummary(messages);

    // Obtener el cliente de MongoDB
    const mongoClient = getMongoDBClient();

    try {
      // Intentar actualizar la conversación con el resumen
      const result = await mongoClient.updateOne(
        COLLECTION_NAME,
        { _id: mongoClient.ObjectId(conversationId), userId: session.user.sub },
        { $set: { summary, updatedAt: new Date() } }
      );

      // Verificar si se actualizó correctamente
      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Conversación no encontrada' });
      }

      // Devolver el resumen generado
      return res.status(200).json({
        success: true,
        summary,
        message: 'Resumen guardado correctamente'
      });
    } catch (dbError) {
      console.error('Error al guardar el resumen:', dbError);
      
      // Devolver el resumen aunque no se haya podido guardar
      return res.status(200).json({
        success: true,
        summary,
        warning: 'No se pudo guardar el resumen en la base de datos',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error en el procesamiento de la solicitud:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
} 