/**
 * Auth0 Debugger - Herramienta para diagnosticar problemas con Auth0
 * 
 * Este script ayuda a identificar y resolver problemas comunes con Auth0,
 * incluyendo errores de configuración, problemas de CORS, y errores específicos
 * como el error 4000.
 */

import { logAuth, logError, logInfo } from './logger';

// Códigos de error conocidos de Auth0 y sus soluciones
const AUTH0_ERROR_CODES = {
  // Errores generales
  'unknown_error': 'Error desconocido de Auth0, revise los logs para más detalles',
  'access_denied': 'Acceso denegado, revise permisos y roles',
  
  // Errores específicos de autorización
  'unauthorized': 'No autorizado, verifique las credenciales',
  
  // Errores de configuración
  '4000': 'Error de configuración: URL de callback no válida. Asegúrese de que la URL de callback esté registrada en la configuración de Auth0.',
  '4001': 'Error de configuración: Dominio Auth0 no válido o solicitud a un tenant inexistente.',
  '4002': 'Error de configuración: Client ID no válido o no corresponde al tenant.',
  '4004': 'Error de configuración: Método Auth0 no válido para este tenant.',
  
  // Errores de CORS
  'blocked_cors': 'Solicitud bloqueada por CORS. Verifique las configuraciones de CORS en Auth0.',
  
  // Errores de token
  'invalid_token': 'Token inválido o expirado',
  'token_expired': 'El token ha expirado, debe volver a iniciar sesión'
};

/**
 * Analiza las URLs de Auth0 para asegurarse de que están correctamente configuradas
 */
export function validateAuth0Configuration() {
  const config = {
    baseUrl: process.env.AUTH0_BASE_URL,
    issuerBaseUrl: process.env.AUTH0_ISSUER_BASE_URL,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    secret: process.env.AUTH0_SECRET,
    audience: process.env.AUTH0_AUDIENCE
  };
  
  const issues = [];
  
  // Verificar que las variables de entorno requeridas existen
  if (!config.baseUrl) issues.push('AUTH0_BASE_URL no está configurado');
  if (!config.issuerBaseUrl) issues.push('AUTH0_ISSUER_BASE_URL no está configurado');
  if (!config.clientId) issues.push('AUTH0_CLIENT_ID no está configurado');
  if (!config.clientSecret) issues.push('AUTH0_CLIENT_SECRET no está configurado');
  if (!config.secret) issues.push('AUTH0_SECRET no está configurado');
  
  // Verificar formato de URLs
  if (config.baseUrl && !config.baseUrl.startsWith('http')) {
    issues.push('AUTH0_BASE_URL debe comenzar con http:// o https://');
  }
  
  if (config.issuerBaseUrl && !config.issuerBaseUrl.startsWith('http')) {
    issues.push('AUTH0_ISSUER_BASE_URL debe comenzar con http:// o https://');
  }
  
  // Verificar que la URL base coincida con localhost en desarrollo
  if (process.env.NODE_ENV === 'development') {
    if (config.baseUrl && !config.baseUrl.includes('localhost') && !config.baseUrl.includes('127.0.0.1')) {
      issues.push('En desarrollo, AUTH0_BASE_URL debe apuntar a localhost o 127.0.0.1');
    }
  }
  
  // Verificar configuraciones específicas para entornos de producción
  if (process.env.NODE_ENV === 'production') {
    if (config.baseUrl && config.baseUrl.includes('localhost')) {
      issues.push('En producción, AUTH0_BASE_URL no debe apuntar a localhost');
    }
  }
  
  // Verificar configuración CORS
  const corsConfigured = process.env.AUTH0_ENABLE_DIRECT_REDIRECT === 'true';
  if (!corsConfigured && process.env.NODE_ENV === 'production') {
    issues.push('AUTH0_ENABLE_DIRECT_REDIRECT no está establecido en "true", lo que puede causar problemas de CORS');
  }
  
  return { 
    valid: issues.length === 0,
    issues,
    config: {
      ...config,
      clientSecret: config.clientSecret ? '******' : undefined, // Ocultar secretos
      secret: config.secret ? '******' : undefined // Ocultar secretos
    }
  };
}

/**
 * Registra información de debug para una sesión Auth0
 */
export function debugAuth0Session(session, location = 'unspecified', context = {}) {
  if (!session) {
    logAuth('Debug Auth0: No session available', null, {
      location,
      timestamp: new Date().toISOString(),
      ...context
    });
    return;
  }
  
  const { user } = session;
  
  if (!user) {
    logAuth('Debug Auth0: Session without user', session, {
      location,
      sessionKeys: Object.keys(session),
      timestamp: new Date().toISOString(),
      ...context
    });
    return;
  }
  
  // Extraer información relevante para el debug
  const userInfo = {
    sub: user.sub,
    email: user.email,
    emailVerified: user.email_verified,
    hasRolesNamespace: !!user['https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'],
    userKeys: Object.keys(user),
    hasPremiumClaim: user['https://dev-zwbfqql3rcbh67rv.us.auth0.com/isPremium'] === true
  };
  
  // Log detallado de la sesión
  logAuth('Debug Auth0: Session information', { user: userInfo }, {
    location,
    timestamp: new Date().toISOString(),
    ...context
  });
  
  if (process.env.NODE_ENV === 'development') {
    // En desarrollo, agregamos un punto de ruptura para inspección interactiva
    debugger; // eslint-disable-line no-debugger
  }
}

/**
 * Maneja y diagnostica errores específicos de Auth0
 */
export function handleAuth0Error(error, context = {}) {
  // Extraer código de error de Auth0
  const errorCode = error.error || 'unknown_error';
  const errorDescription = error.error_description || error.message || 'Error desconocido';
  
  // Buscar mensaje de diagnóstico conocido
  const diagnosisMessage = AUTH0_ERROR_CODES[errorCode] || 'Error no reconocido de Auth0';
  
  // Construir objeto de error enriquecido
  const enhancedError = {
    code: errorCode,
    description: errorDescription,
    diagnosis: diagnosisMessage,
    timestamp: new Date().toISOString(),
    ...context
  };
  
  // Registrar error con información de diagnóstico
  logError(`Auth0 Error: ${errorCode}`, { error: enhancedError });
  
  return {
    error: errorCode,
    description: errorDescription,
    diagnosis: diagnosisMessage
  };
}

/**
 * Comprueba el estado de la conexión con Auth0
 */
export async function checkAuth0Connectivity() {
  try {
    // Intentar obtener información pública del servidor Auth0
    const response = await fetch(`${process.env.AUTH0_ISSUER_BASE_URL}/.well-known/openid-configuration`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      return {
        connected: false,
        status: response.status,
        error: `Error de conexión: ${response.statusText}`
      };
    }
    
    const config = await response.json();
    
    return {
      connected: true,
      endpoints: {
        authorization: config.authorization_endpoint,
        token: config.token_endpoint,
        userInfo: config.userinfo_endpoint
      }
    };
  } catch (error) {
    return {
      connected: false,
      error: `Error de conexión: ${error.message}`
    };
  }
}

/**
 * Realiza una verificación completa de la configuración de Auth0
 */
export async function performAuth0HealthCheck() {
  // Verificar la configuración
  const configCheck = validateAuth0Configuration();
  
  // Verificar conectividad
  const connectivityCheck = await checkAuth0Connectivity();
  
  // Registrar resultado del healthcheck
  logInfo('Auth0 Health Check', {
    configValid: configCheck.valid,
    configIssues: configCheck.issues,
    connectivity: connectivityCheck.connected,
    connectivityDetails: connectivityCheck
  });
  
  return {
    configValid: configCheck.valid,
    configIssues: configCheck.issues,
    connectivity: connectivityCheck.connected,
    connectivityDetails: connectivityCheck,
    timestamp: new Date().toISOString()
  };
}

export default {
  validateAuth0Configuration,
  debugAuth0Session,
  handleAuth0Error,
  checkAuth0Connectivity,
  performAuth0HealthCheck
}; 