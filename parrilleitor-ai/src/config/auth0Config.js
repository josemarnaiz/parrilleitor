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
    // El namespace debe ser una URL que controlemos
    namespace: 'https://parrilleitorai.vercel.app',
    // Los nombres de los claims (sin el namespace)
    isPremium: 'premium_status',
    premiumVerifiedAt: 'premium_verified_at'
  }
};

/**
 * Decodifica un JWT sin verificar la firma
 * @param {string} token - El token JWT a decodificar
 * @returns {Object|null} El payload del token decodificado o null si hay error
 */
function decodeJWT(token) {
  try {
    // El token JWT tiene 3 partes: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid JWT format:', { partsLength: parts.length });
      return null;
    }
    
    // Decodificar el payload (segunda parte)
    const payload = Buffer.from(parts[1], 'base64').toString();
    const decoded = JSON.parse(payload);
    
    // Log del payload decodificado
    console.log('✅ JWT Decoded:', {
      iss: decoded.iss,
      aud: decoded.aud,
      customClaims: Object.keys(decoded).filter(key => key.startsWith('https://'))
    });
    
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Verifica si un usuario tiene acceso premium basado en los claims del access token
 */
export function hasPremiumAccess(token) {
  if (!token) return false;
  
  try {
    // Decodificar el JWT para acceder a los claims
    const decodedToken = decodeJWT(token);
    if (!decodedToken) return false;

    // Los claims personalizados están en el formato namespace/claim
    const premiumClaim = `${auth0Config.customClaims.namespace}/premium_status`;
    
    // Intentar leer los claims del token decodificado
    const premiumStatus = decodedToken[premiumClaim];
    
    // Log del claim específico que buscamos
    console.log('🔑 Premium Claim Check:', {
      claim: premiumClaim,
      value: premiumStatus,
      allCustomClaims: Object.entries(decodedToken)
        .filter(([key]) => key.startsWith(auth0Config.customClaims.namespace))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    });
    
    return premiumStatus === true;
  } catch (error) {
    console.error('Error reading premium claim:', error);
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