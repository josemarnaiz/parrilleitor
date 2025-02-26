import { getSession } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

// Headers comunes
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'https://parrilleitorai.vercel.app',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
}

export async function GET(req) {
  try {
    const session = await getSession(req)

    // Debug session data
    console.log('Roles endpoint - Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString(),
      headers: Object.fromEntries(req.headers.entries())
    })

    // Si no hay sesión pero hay token de autorización, intentar usar eso
    const authHeader = req.headers.get('authorization')
    if (!session?.user && authHeader) {
      console.log('No session but found auth header, attempting to use it')
      // Por ahora devolvemos un 401 más suave que permita reintentos
      return Response.json(
        { error: 'Sesión no encontrada', retryable: true },
        { 
          status: 401,
          headers: commonHeaders
        }
      )
    }

    if (!session?.user) {
      console.log('No session and no auth header found')
      return Response.json(
        { error: 'No autenticado', retryable: false },
        { 
          status: 401,
          headers: commonHeaders
        }
      )
    }

    const email = session.user.email
    const name = session.user.name || email

    // Check both Auth0 roles and allowed users list
    const isAllowedListUser = isInAllowedList(email)
    const roles = session.user[AUTH0_NAMESPACE] || []
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)
    const isPremium = isAllowedListUser || hasPremiumRole

    // Log authorization details
    console.log('Roles endpoint - Authorization check:', {
      email,
      roles,
      isAllowedListUser,
      hasPremiumRole,
      isPremium,
      timestamp: new Date().toISOString()
    })

    return Response.json({
      user: {
        email,
        name,
        roles,
        isPremium,
        isAllowedListUser,
        hasPremiumRole
      }
    }, {
      headers: commonHeaders
    })

  } catch (error) {
    // Enhanced error logging
    console.error('Roles endpoint - Error:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name,
      timestamp: new Date().toISOString()
    })

    return Response.json(
      { 
        error: 'Error al verificar roles',
        details: error.message,
        type: error.constructor.name,
        retryable: true
      },
      { 
        status: 500,
        headers: commonHeaders
      }
    )
  }
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: commonHeaders
  })
}

export const runtime = 'edge' 