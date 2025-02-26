import { getSession } from '@auth0/nextjs-auth0/edge'

const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com'

export async function GET(request) {
  try {
    const session = await getSession(request)
    
    if (!session?.user) {
      return Response.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const roles = session.user[`${AUTH0_NAMESPACE}/roles`] || []
    const email = session.user.email
    const name = session.user.name || email

    return Response.json({
      user: {
        email,
        name,
        roles,
        isPremium: roles.includes('premium')
      }
    })

  } catch (error) {
    console.error('Error checking roles:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge' 