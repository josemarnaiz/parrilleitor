import { getMongoDb } from '@/lib/mongodb';

export async function POST(req) {
  try {
    // Obtener la conexión a MongoDB
    const db = await getMongoDb();
    
    // Intentar guardar la conversación
    try {
      const collection = db.collection('conversations');
      await collection.insertOne({
        // ... datos de la conversación ...
        timestamp: new Date(),
        // Asegurarse de que los datos son serializables
        conversation: JSON.parse(JSON.stringify(conversation))
      });
    } catch (dbError) {
      console.error('Error al guardar en MongoDB:', {
        error: dbError.message,
        code: dbError.code,
        timestamp: new Date().toISOString()
      });
      
      // Continuar con la respuesta pero incluir el warning
      return Response.json({
        response: aiResponse,
        conversation: conversation,
        warning: 'Se obtuvo respuesta de OpenAI pero no se pudo guardar en MongoDB. La conversación continuará pero podría no persistir.',
        dbError: dbError.message
      });
    }
    
    // Si todo fue exitoso
    return Response.json({
      response: aiResponse,
      conversation: conversation
    });
    
  } catch (error) {
    console.error('Error en el endpoint de chat:', error);
    return Response.json({
      error: 'Error procesando la solicitud',
      details: error.message
    }, { status: 500 });
  }
} 