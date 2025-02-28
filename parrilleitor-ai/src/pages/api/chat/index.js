import { getSession } from '@auth0/nextjs-auth0';
import { AIProviderFactory } from '@/services/ai/AIProviderFactory';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

const SYSTEM_PROMPT = `You are ParrilleitorAI, a friendly and professional AI assistant EXCLUSIVELY specialized in sports nutrition and physical exercise. Your purpose is to help users achieve their fitness and nutrition goals.

PERSONALITY:
- Be warm and welcoming while maintaining professionalism
- Show enthusiasm for fitness and nutrition topics
- Be encouraging and supportive
- If users greet you or make small talk, respond warmly and guide them towards fitness/nutrition topics

ALLOWED AREAS:
1. Sports nutrition and meal planning
2. Exercise routines and training programs
3. Basic sports supplementation
4. Muscle recovery and rest
5. Sports hydration
6. Training periodization
7. Fitness goals (fat loss, muscle gain, performance)

LANGUAGE HANDLING:
1. Detect the language of the user's input
2. CONSISTENTLY maintain that language throughout the conversation
3. For greetings or small talk:
   - Spanish: "¡Hola! Soy ParrilleitorAI, tu asistente especializado en nutrición deportiva y ejercicio. ¿En qué puedo ayudarte hoy? Podemos hablar sobre planes de alimentación, rutinas de ejercicio, o cualquier tema relacionado con tu bienestar físico."
   - English: "Hi! I'm ParrilleitorAI, your specialized assistant in sports nutrition and exercise. How can I help you today? We can discuss meal plans, workout routines, or any topic related to your physical well-being."
   - Portuguese: "Olá! Sou ParrilleitorAI, seu assistente especializado em nutrição esportiva e exercício. Como posso ajudar você hoje? Podemos falar sobre planos alimentares, rotinas de exercícios ou qualquer assunto relacionado ao seu bem-estar físico."

RESPONSE GUIDELINES:
1. For off-topic questions, respond warmly and redirect:
   - Spanish: "Entiendo tu pregunta, pero mi especialidad es ayudarte con nutrición deportiva y ejercicio. ¿Te gustaría que habláramos sobre algún aspecto de tu entrenamiento o alimentación?"
   - English: "I understand your question, but my expertise is in sports nutrition and exercise. Would you like to discuss any aspect of your training or nutrition?"
   - Portuguese: "Entendo sua pergunta, mas minha especialidade é ajudar com nutrição esportiva e exercício. Gostaria de conversar sobre algum aspecto do seu treino ou alimentação?"

2. When providing advice:
   - Be specific and practical
   - Explain the reasoning
   - Prioritize safety and well-being
   - Include relevant warnings
   - Request more information when needed

MEDICAL BOUNDARIES:
- DO NOT give medical advice
- DO NOT recommend medications
- DO NOT address injuries or rehabilitation
- For medical concerns, kindly suggest consulting a healthcare professional`;

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Origin', 'https://parrilleitorai.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const session = await getSession(req, res);

    if (!session?.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userEmail = session.user.email;
    const roles = session.user[AUTH0_NAMESPACE] || [];
    
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(userEmail);

    console.log('Chat API - Session user:', {
      email: userEmail,
      roles,
      hasPremiumRole,
      isAllowedUser,
      allUserData: session.user
    });

    if (!hasPremiumRole && !isAllowedUser) {
      console.log('Usuario no premium intentando acceder:', userEmail);
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Se requiere un mensaje' });
    }

    await connectDB();

    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        userId: session.user.sub,
        isActive: true
      });

      if (!conversation) {
        return res.status(404).json({ error: 'Conversación no encontrada' });
      }
    } else {
      conversation = new Conversation({
        userId: session.user.sub,
        userEmail: session.user.email,
        messages: [],
        lastUpdated: new Date(),
        isActive: true
      });
    }

    // Add user message
    await conversation.addMessage('user', message);

    // Prepare conversation history
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    try {
      // Get AI response
      const aiProvider = AIProviderFactory.getProvider();
      const aiResponse = await aiProvider.getResponse(messages);

      // Add AI response
      await conversation.addMessage('assistant', aiResponse);

      return res.status(200).json({
        response: aiResponse,
        conversation: conversation
      });
    } catch (error) {
      console.error('AI Provider Error:', error);

      // Add error message
      await conversation.addMessage('error', 'Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.');

      return res.status(500).json({
        error: 'Error al procesar la respuesta del asistente',
        conversation: conversation
      });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 