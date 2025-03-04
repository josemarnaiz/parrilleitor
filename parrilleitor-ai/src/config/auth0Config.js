// Configuración de Auth0 para la aplicación
export const auth0Config = {
  // Duración de la sesión en segundos (90 días)
  sessionDuration: 90 * 24 * 60 * 60,
  
  // URL de retorno después del login
  returnTo: '/',
  
  // URL de retorno después del logout
  logoutReturnTo: process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app',
  
  // Opciones para evitar problemas de CORS
  useFormData: true,
  useRefreshTokens: true,
  
  // Configuración específica para el logout
  logoutOptions: {
    localOnly: true
  },
  
  authorizationParams: {
    audience: process.env.AUTH0_AUDIENCE || 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/api/v2/',
    scope: process.env.AUTH0_SCOPE || 'openid profile email read:roles'
  },
  
  // Base namespace para Auth0
  baseNamespace: 'https://dev-zwbfqql3rcbh67rv.us.auth0.com',
  
  // Claims específicos que Auth0 nos envía
  claims: {
    roles: 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles',
    isPremium: 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/isPremium',
    premiumVerifiedAt: 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/premiumVerifiedAt'
  },
  
  // ID del rol premium
  premiumRoleId: 'rol_vWDGREdcQo4ulVhS'
};

/**
 * Verifica si un usuario tiene acceso premium basado en los claims de Auth0
 */
export function hasPremiumAccess(user) {
  if (!user) return false;
  
  const { claims } = auth0Config;
  
  // Verificar el claim directo de isPremium
  if (user[claims.isPremium] === true) {
    return true;
  }
  
  // Verificar roles
  const roles = user[claims.roles];
  if (Array.isArray(roles) && roles.includes(auth0Config.premiumRoleId)) {
    return true;
  }
  
  return false;
}

/**
 * Obtiene los roles de un usuario desde los claims de Auth0
 */
export function getUserRoles(user) {
  if (!user) return [];
  
  const roles = user[auth0Config.claims.roles];
  return Array.isArray(roles) ? roles : [];
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