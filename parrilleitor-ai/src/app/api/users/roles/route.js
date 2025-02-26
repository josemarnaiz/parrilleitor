import { getSession, withApiAuthRequired } from '@auth0/nextjs-auth0/edge'
import { isInAllowedList } from '@/config/allowedUsers'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

// Headers comunes
const commonHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Content-Type': 'application/json',
}

async function handler(req) {
  try {
    const session = await getSession(req)

    // Debug session data
    console.log('Roles endpoint - Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      timestamp: new Date().toISOString()
    })

    if (!session?.user) {
      console.log('No session found in roles endpoint')
      return Response.json(
        { error: 'No autenticado' },
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
        type: error.constructor.name
      },
      { 
        status: 500,
        headers: commonHeaders
      }
    )
  }
}

export const GET = withApiAuthRequired(handler)

export const runtime = 'edge' 