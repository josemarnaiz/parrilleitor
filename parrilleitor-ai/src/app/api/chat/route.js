import { getMongoDb } from '@/lib/mongodb';

export async function POST(req) {
  let aiResponse = null;
  let conversation = null;
  
  try {
    // Obtener los datos de la solicitud
    const data = await req.json();
    aiResponse = data.response;
    conversation = data.conversation;
    
    // Validar que tenemos los datos necesarios
    if (!aiResponse || !conversation) {
      throw new Error('Datos de conversación incompletos');
    }
    
    // Obtener la conexión a MongoDB con retry
    let db = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        db = await getMongoDb();
        break;
      } catch (error) {
        retryCount++;
        if (retryCount === maxRetries) {
          throw error;
        }
        console.log(`Intento ${retryCount} de ${maxRetries} de conexión a MongoDB fallido, reintentando...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }
    
    // Intentar guardar la conversación
    try {
      const collection = db.collection('conversations');
      
      // Preparar el documento
      const doc = {
        timestamp: new Date(),
        conversation: JSON.parse(JSON.stringify(conversation)),
        aiResponse: JSON.parse(JSON.stringify(aiResponse))
      };
      
      // Intentar la inserción con timeout
      const insertPromise = collection.insertOne(doc);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout al guardar en MongoDB')), 5000)
      );
      
      await Promise.race([insertPromise, timeoutPromise]);
      
      console.log('Conversación guardada exitosamente en MongoDB');
      
      // Si todo fue exitoso
      return Response.json({
        response: aiResponse,
        conversation: conversation,
        saved: true
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
        dbError: dbError.message,
        saved: false
      });
    }
    
  } catch (error) {
    console.error('Error en el endpoint de chat:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Si tenemos una respuesta parcial, la devolvemos con error
    if (aiResponse) {
      return Response.json({
        response: aiResponse,
        conversation: conversation || [],
        error: 'Error procesando la solicitud',
        details: error.message,
        saved: false
      });
    }
    
    // Si no hay respuesta, devolvemos error completo
    return Response.json({
      error: 'Error procesando la solicitud',
      details: error.message
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  }
} 