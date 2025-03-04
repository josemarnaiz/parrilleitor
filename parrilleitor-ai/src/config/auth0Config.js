// Configuración de Auth0 para la aplicación
export const auth0Config = {
  // Duración de la sesión en segundos (24 horas)
  sessionDuration: 24 * 60 * 60,
  
  // URLs de retorno
  returnTo: '/',
  logoutReturnTo: process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app',
  
  // Opciones para evitar problemas de CORS
  useFormData: true,
  useRefreshTokens: true,
  
  logoutOptions: {
    localOnly: true
  },
  
  // Configuración de autorización
  authorizationParams: {
    audience: process.env.AUTH0_AUDIENCE || 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/api/v2/',
    // Definimos los scopes que necesitamos
    scope: 'openid profile email read:premium_content access:premium_features'
  },
  
  // Scopes para funcionalidades premium
  premiumScopes: [
    'read:premium_content',
    'access:premium_features'
  ]
};

/**
 * Verifica si un usuario tiene acceso premium basado en sus scopes
 */
export function hasPremiumAccess(accessToken) {
  if (!accessToken?.scope) return false;
  
  // Convertir el string de scopes en array
  const scopes = accessToken.scope.split(' ');
  
  // Verificar si tiene los scopes premium necesarios
  return auth0Config.premiumScopes.some(scope => scopes.includes(scope));
}

/**
 * Obtiene la información del usuario usando el endpoint userinfo
 */
export async function getUserInfo(accessToken) {
  try {
    const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

/**
 * Obtiene la configuración de Auth0 para el middleware
 */
export function getAuth0Config() {
  return {
    ...auth0Config,
    auth0Audience: process.env.AUTH0_AUDIENCE,
    auth0BaseURL: process.env.AUTH0_BASE_URL,
    auth0ClientID: process.env.AUTH0_CLIENT_ID,
    auth0ClientSecret: process.env.AUTH0_CLIENT_SECRET,
    auth0Issuer: process.env.AUTH0_ISSUER_BASE_URL,
    auth0Secret: process.env.AUTH0_SECRET,
    cookies: {
      sameSite: 'lax'
    }
  };
} 