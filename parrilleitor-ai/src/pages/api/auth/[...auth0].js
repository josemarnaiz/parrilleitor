import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';

// Configuración personalizada para el callback de Auth0
const afterCallback = (req, res, session) => {
  // Asegurarse de que session siempre tenga una estructura correcta
  if (!session) {
    return session;
  }

  // Asegurarse de que user existe
  if (!session.user) {
    session.user = {};
  }

  // Procesar roles si existen en idToken
  const user = session.user;
  
  if (user && req.body && req.body.id_token) {
    try {
      // Intentar decodificar el id_token para extraer roles
      const decoded = JSON.parse(
        Buffer.from(req.body.id_token.split('.')[1], 'base64').toString()
      );
      
      // Verificar si hay roles en el token
      if (decoded && decoded[AUTH0_NAMESPACE]) {
        user[AUTH0_NAMESPACE] = decoded[AUTH0_NAMESPACE];
      }
    } catch (error) {
      console.error('Error al procesar id_token:', error);
    }
  }

  return session;
};

// Exportar el manejador con configuración personalizada
export default handleAuth({
  callback: async (req, res) => {
    try {
      // Añadir cabeceras CORS para permitir solicitudes desde el dominio de la aplicación
      res.setHeader('Access-Control-Allow-Origin', process.env.AUTH0_BASE_URL || '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // Usar el manejador personalizado para el callback
      await handleCallback(req, res, { afterCallback });
    } catch (error) {
      console.error('Error en auth callback:', error);
      res.status(error.status || 500).json({
        error: error.message,
        description: 'Error durante la autenticación'
      });
    }
  }
}); 