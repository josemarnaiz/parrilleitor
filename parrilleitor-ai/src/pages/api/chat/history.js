import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';
import connectDB from '@/lib/mongodb';
import Conversation from '@/models/Conversation';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// Common headers
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};

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

  try {
    const session = await getSession(req, res);

    if (!session?.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verify premium access
    const roles = session.user[AUTH0_NAMESPACE] || [];
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID);
    const isAllowedUser = isInAllowedList(session.user.email);

    if (!hasPremiumRole && !isAllowedUser) {
      return res.status(403).json({ error: 'Se requiere una cuenta premium' });
    }

    await connectDB();

    if (req.method === 'GET') {
      const conversations = await Conversation.find({
        userId: session.user.sub,
        isActive: true
      })
      .sort({ lastUpdated: -1 })
      .limit(10);

      return res.status(200).json(conversations);
    }

    if (req.method === 'POST') {
      const { title } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'Se requiere un título' });
      }

      const conversation = new Conversation({
        userId: session.user.sub,
        title,
        messages: [],
        lastUpdated: new Date(),
        isActive: true
      });

      await conversation.save();
      return res.status(201).json(conversation);
    }

    // Method not allowed
    return res.status(405).json({ error: 'Método no permitido' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
} 