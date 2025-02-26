import { getSession } from '@auth0/nextjs-auth0'
import { isInAllowedList } from '@/config/allowedUsers'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles'
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS'

export async function GET(request) {
  try {
    const session = await getSession(request)
    
    // Debug session data
    console.log('Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRoles: session?.user?.[AUTH0_NAMESPACE]
    })

    if (!session?.user) {
      console.log('No session found or session expired')
      return Response.json(
        { error: 'No autenticado. Por favor, inicia sesión nuevamente.' },
        { status: 401 }
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
      hasPremiumRole,
      allowedByList: isAllowedListUser,
      allowedByRole: hasPremiumRole,
      finalAccess: isAllowedListUser || hasPremiumRole
    })

    const isPremium = isAllowedListUser || hasPremiumRole

    // Log access decision
    console.log(`Access decision for ${email}:`, {
      isPremium,
      reason: isPremium 
        ? (isAllowedListUser ? 'Allowed by list' : 'Has premium role')
        : 'No premium access'
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
      { status: 500 }
    )
  }
} 