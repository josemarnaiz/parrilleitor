import { getSession } from '@auth0/nextjs-auth0';
import { isInAllowedList } from '@/config/allowedUsers';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

export default async function handler(req, res) {
  try {
    // Verificar método
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Obtener la sesión del usuario
    const session = await getSession(req, res);
    if (!session || !session.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Verificar que el usuario está en la lista de permitidos
    const userEmail = session.user.email;
    if (!isInAllowedList(userEmail)) {
      return res.status(403).json({ error: 'Usuario no autorizado' });
    }

    // Obtener roles de Auth0 (si existen en la sesión)
    const roles = session.user[AUTH0_NAMESPACE] || [];
    const isPremium = roles.includes(PREMIUM_ROLE_ID);

    // También consideramos premium a algunos usuarios por email (para desarrollo)
    const specialPremiumUsers = [
      'josem.arnaizmartin@gmail.com',
      'cesar.carlos.parrilla@gmail.com'
    ];
    
    const isSpecialPremium = specialPremiumUsers.includes(userEmail);

    // Construir el objeto de respuesta con la información del usuario
    const userInfo = {
      isPremium: isPremium || isSpecialPremium,
      email: userEmail,
      name: session.user.name,
      picture: session.user.picture,
      // Puedes incluir más información según sea necesario
    };

    // Devolver la información del usuario
    return res.status(200).json({ user: userInfo });
  } catch (error) {
    console.error('Error al obtener roles del usuario:', error);
    return res.status(500).json({ error: 'Error del servidor al verificar los roles' });
  }
} 