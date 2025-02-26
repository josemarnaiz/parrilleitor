import { withMiddlewareAuthRequired, getSession } from '@auth0/nextjs-auth0/edge'

// Lista de emails autorizados
const AUTHORIZED_EMAILS = [
  // Agrega aquí los emails que quieras autorizar
  'ejemplo@email.com'
]

export default withMiddlewareAuthRequired(async function middleware(req) {
  const res = new Response()
  const session = await getSession(req, res)

  // Verifica si el email del usuario está en la lista de autorizados
  if (session?.user?.email && !AUTHORIZED_EMAILS.includes(session.user.email)) {
    // Si no está autorizado, redirige a una página de acceso denegado
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/unauthorized',
      },
    })
  }

  return res
})

// Configura en qué rutas se aplicará este middleware
export const config = {
  matcher: ['/chat/:path*']
} 