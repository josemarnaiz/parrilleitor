import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

async function handler(request) {
  try {
    const session = await getSession(request)
    
    // Debug session data
    console.log('Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRoles: session?.user?.[AUTH0_NAMESPACE],
      headers: Object.fromEntries(request.headers),
      cookies: request.cookies
    })

    if (!session?.user) {
      console.log('No session found or session expired')
      return Response.json(
        { error: 'No autenticado. Por favor, inicia sesión nuevamente.' },
        { 
          status: 401,
          headers: {
            'Cache-Control': 'no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        }
      )
    }

    const email = session.user.email
    const name = session.user.name || email
    
    // Check both Auth0 roles and allowed users list
    const isAllowedListUser = isInAllowedList(email)
    const roles = session.user[AUTH0_NAMESPACE] || []
    const hasPremiumRole = roles.includes(PREMIUM_ROLE_ID)

    // Debug authorization data
    console.log('Authorization check:', {
      email,
      roles,
      isAllowedListUser,
      hasPremiumRole
    })

    return Response.json({
      user: {
        email,
        name,
        roles,
        isPremium: hasPremiumRole || isAllowedListUser,
        isAllowedListUser,
        hasPremiumRole
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })

  } catch (error) {
    // Enhanced error logging
    console.error('Error in roles endpoint:', {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    })

    return Response.json(
      { 
        error: 'Error al verificar roles',
        details: error.message,
        type: error.constructor.name
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    )
  }
}

export const GET = withApiAuthRequired(handler)

export const runtime = 'edge' 