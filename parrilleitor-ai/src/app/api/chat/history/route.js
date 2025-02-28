import { getSession } from '@auth0/nextjs-auth0/edge';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// Headers comunes
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

export async function GET(req) {
  try {
    const session = await getSession(req);

    if (!session?.user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401, headers: commonHeaders }
      );
    }

    // Verify premium access
    const roles = session.user[AUTH0_NAMESPACE] || [];
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(session.user.email);

    if (!hasPremiumRole && !isAllowedUser) {
      return Response.json(
        { error: 'Se requiere una cuenta premium' },
        { status: 403, headers: commonHeaders }
      );
    }

    await connectDB();

    const conversations = await Conversation.find({
      userId: session.user.sub,
      isActive: true
    })
    .sort({ lastUpdated: -1 })
    .limit(10);

    return Response.json({ conversations }, { headers: commonHeaders });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return Response.json(
      { error: 'Error al obtener el historial' },
      { status: 500, headers: commonHeaders }
    );
  }
}

export async function POST(req) {
  try {
    const session = await getSession(req);

    if (!session?.user) {
      return Response.json(
        { error: 'No autenticado' },
        { status: 401, headers: commonHeaders }
      );
    }

    // Verify premium access
    const roles = session.user[AUTH0_NAMESPACE] || [];
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(session.user.email);

    if (!hasPremiumRole && !isAllowedUser) {
      return Response.json(
        { error: 'Se requiere una cuenta premium' },
        { status: 403, headers: commonHeaders }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Formato de mensajes inválido' },
        { status: 400, headers: commonHeaders }
      );
    }

    await connectDB();

    // Create or update conversation
    let conversation = await Conversation.findOne({
      userId: session.user.sub,
      isActive: true
    }).sort({ lastUpdated: -1 });

    if (!conversation) {
      conversation = new Conversation({
        userId: session.user.sub,
        userEmail: session.user.email,
        messages: messages
      });
    } else {
      conversation.messages = messages;
      conversation.lastUpdated = new Date();
    }

    await conversation.save();

    return Response.json(
      { success: true, conversation },
      { headers: commonHeaders }
    );

  } catch (error) {
    console.error('Error saving chat history:', error);
    return Response.json(
      { error: 'Error al guardar la conversación' },
      { status: 500, headers: commonHeaders }
    );
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: commonHeaders
  });
}

export const runtime = 'edge'; 