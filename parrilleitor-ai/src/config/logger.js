/**
 * Sistema avanzado de logging para Parrilleitor AI
 * Diseñado para capturar información detallada en entornos de producción y desarrollo
 */

import { connectToDatabase } from '../services/database';

// Configuración del logger
const DETAILED_LOGGING = true; // Habilitar logs detallados
const SAVE_TO_DB = true; // Guardar logs en la base de datos
const LOG_COLLECTION = 'logs'; // Nombre de la colección en MongoDB

// Niveles de log
const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  AUTH: 'AUTH',
  AUTH_ERROR: 'AUTH_ERROR'
};

/**
 * Obtiene un timestamp formateado para los logs
 * @returns {string} - Timestamp en formato ISO
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Determina si estamos en entorno de producción
 * @returns {boolean} - true si estamos en producción
 */
function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Determina si estamos en Vercel
 * @returns {boolean} - true si estamos en Vercel
 */
function isVercel() {
  return !!process.env.VERCEL || !!process.env.VERCEL_ENV;
}

/**
 * Sanitiza los datos de usuario para logs
 * @param {Object} user - Objeto de usuario de Auth0
 * @returns {Object} - Datos sanitizados del usuario
 */
function sanitizeUserData(user) {
  if (!user) return null;
  
  // En producción, solo incluir información esencial
  if (isProduction()) {
    return {
      email: user.email,
      sub: user.sub
    };
  }
  
  // En desarrollo, incluir más información pero omitir tokens
  const sanitized = { ...user };
  // Omitir información sensible
  delete sanitized.id_token;
  delete sanitized.access_token;
  delete sanitized.refresh_token;
  
  return sanitized;
}

/**
 * Función base para registrar logs
 * @param {string} level - Nivel de log (INFO, ERROR, etc.)
 * @param {string} message - Mensaje principal del log
 * @param {Object} data - Datos adicionales para el log
 * @param {Object} metadata - Metadatos adicionales del contexto
 */
async function logBase(level, message, data = null, metadata = {}) {
  const timestamp = getTimestamp();
  const environment = isProduction() ? 'production' : 'development';
  const isInVercel = isVercel();
  
  // Sanitizar datos sensibles si hay un usuario
  let sanitizedData = data;
  if (data && data.user) {
    sanitizedData = { 
      ...data,
      user: sanitizeUserData(data.user)
    };
  }
  
  // Estructura del log
  const logEntry = {
    level,
    message,
    timestamp,
    environment,
    isVercel: isInVercel,
    ...metadata,
    data: sanitizedData
  };
  
  // Mostrar el log en la consola
  if (isProduction()) {
    // En producción, usar solo console.log para evitar problemas con colorización
    console.log(JSON.stringify(logEntry));
  } else {
    // En desarrollo, usar diferentes niveles de log de consola
    switch (level) {
      case LOG_LEVELS.ERROR:
      case LOG_LEVELS.AUTH_ERROR:
        console.error(`[${level}] ${message}`, logEntry);
        break;
      case LOG_LEVELS.WARN:
        console.warn(`[${level}] ${message}`, logEntry);
        break;
      case LOG_LEVELS.DEBUG:
        console.debug(`[${level}] ${message}`, logEntry);
        break;
      default:
        console.log(`[${level}] ${message}`, logEntry);
    }
  }
  
  // Guardar en la base de datos si está habilitado
  if (SAVE_TO_DB) {
    try {
      const { db } = await connectToDatabase();
      await db.collection(LOG_COLLECTION).insertOne(logEntry);
    } catch (error) {
      // Si falla guardar el log, al menos mostrarlo en consola
      console.error(`Error guardando log en base de datos: ${error.message}`);
    }
  }
  
  return logEntry;
}

/**
 * Registra información de autenticación y sesión
 * @param {string} message - Mensaje descriptivo
 * @param {Object} session - Sesión del usuario (opcional)
 * @param {Object} metadata - Metadatos adicionales
 */
export function logAuth(message, session = null, metadata = {}) {
  let sessionData = null;
  
  if (session) {
    sessionData = {
      user: session.user,
      isAuthenticated: !!session.user
    };
  }
  
  return logBase(LOG_LEVELS.AUTH, message, sessionData, metadata);
}

/**
 * Registra errores relacionados con autenticación
 * @param {string} message - Mensaje descriptivo
 * @param {Error} error - Objeto de error (opcional)
 * @param {Object} session - Sesión del usuario (opcional)
 * @param {Object} metadata - Metadatos adicionales
 */
export function logAuthError(message, error = null, session = null, metadata = {}) {
  const errorData = error ? {
    message: error.message,
    name: error.name,
    stack: isProduction() ? undefined : error.stack,
  } : null;
  
  const sessionData = session ? {
    user: session.user,
    isAuthenticated: !!session.user
  } : null;
  
  return logBase(LOG_LEVELS.AUTH_ERROR, message, {
    error: errorData,
    session: sessionData
  }, metadata);
}

/**
 * Registra información sobre decisiones de control de acceso
 * @param {string} message - Mensaje descriptivo
 * @param {Object} user - Información del usuario
 * @param {Object} accessData - Datos de la decisión de acceso
 * @param {Object} metadata - Metadatos adicionales
 */
export function logAccess(message, user, accessData = {}, metadata = {}) {
  return logBase(LOG_LEVELS.INFO, message, {
    user,
    access: accessData
  }, metadata);
}

/**
 * Registra errores generales
 * @param {string} message - Mensaje descriptivo
 * @param {Error} error - Objeto de error (opcional)
 * @param {Object} metadata - Metadatos adicionales
 */
export function logError(message, error = null, metadata = {}) {
  const errorData = error ? {
    message: error.message,
    name: error.name,
    stack: isProduction() ? undefined : error.stack,
  } : null;
  
  return logBase(LOG_LEVELS.ERROR, message, { error: errorData }, metadata);
}

/**
 * Registra información general
 * @param {string} message - Mensaje descriptivo
 * @param {Object} metadata - Metadatos adicionales
 */
export function logInfo(message, metadata = {}) {
  return logBase(LOG_LEVELS.INFO, message, null, metadata);
}

/**
 * Registra información de depuración (solo en desarrollo)
 * @param {string} message - Mensaje descriptivo
 * @param {Object} data - Datos adicionales
 */
export function logDebug(message, data = {}) {
  if (!isProduction()) {
    return logBase(LOG_LEVELS.DEBUG, message, data);
  }
}

// Exportar la API completa
export default {
  logAuth,
  logAuthError,
  logAccess,
  logError,
  logInfo,
  logDebug
}; 