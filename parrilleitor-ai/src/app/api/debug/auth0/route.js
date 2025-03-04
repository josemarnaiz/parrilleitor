import { getSession } from '@auth0/nextjs-auth0/edge'
import { NextResponse } from 'next/server'
import { hasPremiumAccess, auth0Config } from '@/config/auth0Config'
import { isInAllowedList } from '@/config/allowedUsers'
import { 
  validateAuth0Configuration, 
  checkAuth0Connectivity,
  handleAuth0Error
} from '../../../../config/auth0Debugger'
import { connectToDatabase as connectToMongoDbEdge } from '../../../../lib/mongodb-edge.js'

// Función simple de log para Edge Runtime
const edgeLog = (type, message, data = {}) => {
  console.log(JSON.stringify({
    type,
    message,
    timestamp: new Date().toISOString(),
    data
  }));
};

// Headers comunes
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

// Lista de correos electrónicos autorizados para acceder al debug completo
const DEBUG_ACCESS_EMAILS = ['user1@example.com', 'user2@example.com'] // Reemplazar con correos reales
const ADMIN_EMAILS = ['user1@example.com'] // Reemplazar con correos reales

// Verificar si un usuario tiene acceso a diagnóstico completo
function hasDebugAccess(email) {
  return DEBUG_ACCESS_EMAILS.includes(email)
}

/**
 * Verifica si un usuario es administrador
 */
function isAdmin(email) {
  return ADMIN_EMAILS.includes(email)
}

/**
 * Endpoint de depuración para Auth0 - Versión de producción
 * Muestra información detallada sobre la sesión y el token
 */
export async function GET(req) {
  const requestId = crypto.randomUUID()
  
  try {
    // Obtener la sesión
    let session = null
    try {
      session = await getSession(req)
    } catch (error) {
      edgeLog('error', 'Error al obtener sesión en diagnóstico Auth0', { error: error.message, requestId })
    }
    
    // Verificar nivel de acceso
    let hasAccess = false
    let isAdminUser = false
    let userEmail = null
    let debugAccess = false
    
    if (session?.user) {
      userEmail = session.user.email
      isAdminUser = isAdmin(userEmail)
      const isAllowed = isInAllowedList(userEmail)
      const hasPremium = hasPremiumAccess(session.user)
      debugAccess = hasDebugAccess(userEmail)
      
      // Acceso completo para admins, acceso parcial para usuarios permitidos o premium
      hasAccess = isAdminUser || isAllowed || hasPremium
      
      edgeLog('auth', 'Auth0 Diagnóstico - verificación de acceso', {
        requestId,
        userEmail,
        isAdmin: isAdminUser,
        isAllowed,
        hasPremium,
        hasAccess,
        debugAccess
      })
    }
    
    // Validar la configuración de Auth0
    const configValidation = validateAuth0Configuration()
    
    // Comprobar conectividad con Auth0
    const connectivity = await checkAuth0Connectivity()
    
    // Información básica del entorno
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      vercelRegion: process.env.VERCEL_REGION,
      isProduction: process.env.NODE_ENV === 'production',
      timestamp: new Date().toISOString(),
      requestId
    }
    
    // Preparar respuesta
    const baseResponse = {
      auth: {
        isAuthenticated: !!session?.user,
        email: userEmail,
        hasAccess,
        debugAccess
      },
      environment,
      connectivity: connectivity.connected,
      connectivityDetails: hasAccess ? connectivity : undefined,
      timestamp: new Date().toISOString()
    }
    
    // Si tiene acceso completo, añadir información detallada
    if (debugAccess || isAdminUser) {
      // Añadir información técnica detallada
      return NextResponse.json({
        ...baseResponse,
        configValid: configValidation.valid,
        configIssues: configValidation.issues,
        config: configValidation.config,
        user: session?.user ? {
          sub: session.user.sub,
          email: session.user.email,
          emailVerified: session.user.email_verified,
          properties: Object.keys(session.user)
        } : null,
        sessionKeys: session ? Object.keys(session) : [],
        recommendations: getRecommendations(configValidation, connectivity, session)
      }, { headers: commonHeaders })
    } 
    
    // Para usuarios sin acceso completo, devolver información limitada
    return NextResponse.json({
      ...baseResponse,
      configValid: configValidation.valid,
      recommendations: getRecommendations(configValidation, connectivity, session),
      message: hasAccess 
        ? "Información de diagnóstico limitada. Para acceso completo, contacta al administrador."
        : "Debes iniciar sesión para ver información detallada."
    }, { headers: commonHeaders })
    
  } catch (error) {
    edgeLog('error', 'Error en endpoint de diagnóstico Auth0', { error: error.message, requestId })
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al generar el diagnóstico',
      timestamp: new Date().toISOString()
    }, { status: 500, headers: commonHeaders })
  }
}

/**
 * Maneja solicitudes POST para registrar errores de Auth0 desde el cliente
 */
export async function POST(req) {
  const requestId = crypto.randomUUID()
  
  try {
    // Intentar obtener la sesión del usuario
    let session = null
    try {
      session = await getSession(req)
    } catch (error) {
      // Solo registrar el error, no necesitamos detener el proceso
      edgeLog('error', 'Error al obtener sesión en reporte de error Auth0', { error: error.message, requestId })
    }
    
    // Parsear el cuerpo de la solicitud
    const data = await req.json()
    
    // Registrar el error reportado
    if (data.error) {
      const errorInfo = handleAuth0Error(data.error, {
        requestId,
        source: data.source || 'client',
        url: data.url,
        userEmail: session?.user?.email || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      })
      
      return NextResponse.json({
        status: 'error_logged',
        error: errorInfo,
        suggestions: getSuggestionsForError(data.error.code),
        timestamp: new Date().toISOString()
      }, { headers: commonHeaders })
    }
    
    // Si no hay error, simplemente registrar el evento
    edgeLog('auth', 'Reporte desde cliente Auth0', {
      requestId,
      data,
      userAgent: req.headers.get('user-agent') || 'unknown'
    })
    
    return NextResponse.json({
      status: 'logged',
      timestamp: new Date().toISOString()
    }, { headers: commonHeaders })
    
  } catch (error) {
    edgeLog('error', 'Error al procesar reporte de cliente Auth0', { error: error.message, requestId })
    
    return NextResponse.json({
      error: 'Error interno del servidor',
      message: 'No se pudo procesar el reporte',
      timestamp: new Date().toISOString()
    }, { status: 500, headers: commonHeaders })
  }
}

/**
 * Genera recomendaciones basadas en los resultados del diagnóstico
 */
function getRecommendations(configValidation, connectivity, session) {
  const recommendations = []
  
  // Recomendaciones basadas en problemas de configuración
  if (!configValidation.valid && configValidation.issues.length > 0) {
    configValidation.issues.forEach(issue => {
      recommendations.push(`Configuración: ${issue}`)
    })
  }
  
  // Recomendaciones basadas en problemas de conectividad
  if (!connectivity.connected) {
    recommendations.push(`Conectividad: No se pudo conectar a Auth0. ${connectivity.error || ''}`)
    recommendations.push('Verifica que la URL de Auth0 sea correcta y esté accesible.')
  }
  
  // Recomendaciones basadas en la sesión
  if (!session || !session.user) {
    recommendations.push('No hay sesión de usuario activa. Intenta iniciar sesión nuevamente.')
  } else {
    // Verificar que los roles estén presentes
    const hasRoles = session.user['https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles']
    if (!hasRoles) {
      recommendations.push('No se detectaron roles en la sesión. Verifica la configuración de Auth0 para asegurar que los roles se incluyan en el token.')
    }
  }
  
  // Si no hay problemas, incluir una recomendación general
  if (recommendations.length === 0) {
    recommendations.push('La configuración parece estar correcta. Si sigues experimentando problemas, verifica los logs del servidor para más detalles.')
  }
  
  return recommendations
}

/**
 * Obtiene sugerencias específicas para un código de error
 */
function getSuggestionsForError(errorCode) {
  const suggestions = []
  
  switch (errorCode) {
    case '4000':
      suggestions.push('Verifica que la URL de callback esté correctamente registrada en la configuración de Auth0.')
      suggestions.push(`La URL de callback debe ser: ${process.env.AUTH0_BASE_URL}/api/auth/callback`)
      suggestions.push('Asegúrate de haber guardado los cambios en el panel de Auth0 después de actualizar la URL.')
      break
      
    case '4001':
      suggestions.push('Verifica que el dominio de Auth0 sea correcto.')
      suggestions.push('Comprueba que estás usando el tenant correcto de Auth0.')
      break
      
    case '4002':
      suggestions.push('Verifica que el Client ID sea correcto y corresponda al tenant de Auth0.')
      break
      
    case 'blocked_cors':
      suggestions.push('Estás experimentando un problema de CORS. Verifica las configuraciones de Auth0.')
      suggestions.push('Intenta usar el modo de redirección directa para evitar problemas de CORS.')
      break
      
    default:
      suggestions.push('Verifica la configuración general de Auth0.')
      suggestions.push('Consulta los logs del servidor para obtener más detalles sobre el error.')
  }
  
  return suggestions
}

// Manejar peticiones OPTIONS para CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...commonHeaders,
      'Access-Control-Max-Age': '86400'
    }
  })
} 