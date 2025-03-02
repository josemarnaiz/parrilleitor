// Configuración de Auth0 para la aplicación
export const auth0Config = {
  // Duración de la sesión en segundos (90 días)
  sessionDuration: 90 * 24 * 60 * 60,
  
  // URL de retorno después del login
  returnTo: '/',
  
  // URL de retorno después del logout
  logoutReturnTo: process.env.AUTH0_BASE_URL || 'https://parrilleitorai.vercel.app',
  
  // Opciones para evitar problemas de CORS
  useFormData: true, // Usar form data en lugar de fetch API
  useRefreshTokens: true, // Usar refresh tokens para mantener la sesión
  
  // Configuración específica para el logout
  logoutOptions: {
    // No usar el logout global de Auth0 para evitar CORS
    // Esto hace que el logout sea solo local (en la aplicación)
    localOnly: true
  },
  
  authorizationParams: {
    // Parámetros adicionales para la autorización
    audience: process.env.AUTH0_AUDIENCE || 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/api/v2/',
    scope: process.env.AUTH0_SCOPE || 'openid profile email read:roles'
  },
  
  // Configuración de roles y claims de Auth0
  rolePaths: [
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles',  // Namespace estándar de Auth0
    'roles',                                            // Propiedad roles directa
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com.roles',  // Formato alternativo
    'https://dev-zwbfqql3rcbh67rv.us.auth0.com/user_authorization.roles'  // Otro formato común
  ],
  
  // ID del rol premium
  premiumRoleId: 'rol_vWDGREdcQo4ulVhS'
}

// Función para obtener la configuración de Auth0
export function getAuth0Config() {
  return auth0Config
}

// Función auxiliar para detectar rol premium en un objeto de usuario Auth0
export function hasPremiumAccess(user) {
  if (!user) return false;
  
  // 1. Verificar en todas las rutas de roles configuradas
  for (const rolePath of auth0Config.rolePaths) {
    const roles = user[rolePath];
    if (Array.isArray(roles) && roles.includes(auth0Config.premiumRoleId)) {
      return true;
    }
  }
  
  // 2. Buscar en objetos anidados (espacios de nombres)
  const authNamespace = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com';
  if (user[authNamespace] && Array.isArray(user[authNamespace].roles)) {
    if (user[authNamespace].roles.includes(auth0Config.premiumRoleId)) {
      return true;
    }
  }
  
  // 3. Buscar por nombre en cualquier array
  for (const key in user) {
    if (Array.isArray(user[key])) {
      const hasNameMatch = user[key].some(item => 
        typeof item === 'string' && 
        (item === auth0Config.premiumRoleId || item.toLowerCase().includes('premium'))
      );
      if (hasNameMatch) return true;
    }
  }
  
  return false;
} 