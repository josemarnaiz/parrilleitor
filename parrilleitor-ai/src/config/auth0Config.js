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
    // Scopes básicos que necesitamos
    scope: 'openid profile email'
  },
  
  // Claims personalizados con namespace apropiado
  customClaims: {
    namespace: 'https://parrilleitorai.vercel.app',
    isPremium: 'premium_status',
    premiumVerifiedAt: 'premium_verified_at'
  }
};

/**
 * Verifica si un usuario tiene acceso premium basado en los claims
 */
export function hasPremiumAccess(accessToken) {
  if (!accessToken) return false;
  
  try {
    // Log completo del token para debugging
    console.log('Token debug:', {
      keys: Object.keys(accessToken),
      claims: Object.entries(accessToken)
        .filter(([key]) => key.includes(auth0Config.customClaims.namespace))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
      timestamp: new Date().toISOString()
    });

    // Verificar el claim personalizado de premium usando el namespace correcto
    const premiumClaim = `${auth0Config.customClaims.namespace}/premium_status`;
    const verifiedAtClaim = `${auth0Config.customClaims.namespace}/premium_verified_at`;
    
    const premiumStatus = accessToken[premiumClaim];
    const premiumVerifiedAt = accessToken[verifiedAtClaim];
    
    // Log para debugging
    console.log('Premium access check:', {
      premiumClaim,
      verifiedAtClaim,
      premiumStatus,
      premiumVerifiedAt,
      timestamp: new Date().toISOString()
    });
    
    return premiumStatus === true;
  } catch (error) {
    console.error('Error checking premium access:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return false;
  }
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