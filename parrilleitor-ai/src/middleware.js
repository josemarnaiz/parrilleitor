import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0/edge';

// Constantes
const AUTH0_NAMESPACE = 'https://dev-zwbfqql3rcbh67rv.us.auth0.com/roles';
const PREMIUM_ROLE_ID = 'rol_vWDGREdcQo4ulVhS';

// Lista de orígenes permitidos
const allowedOrigins = [
  'https://parrilleitorai.vercel.app',
  'http://localhost:3000',
  'https://dev-zwbfqql3rcbh67rv.us.auth0.com',
];

// Middleware para gestionar CORS y procesar tokens Auth0
export async function middleware(request) {
  // Obtener el origen de la solicitud
  const origin = request.headers.get('origin');
  const requestHeaders = new Headers(request.headers);
  
  // Verificar si el origen es permitido
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  // Crear una respuesta con cabeceras modificadas
  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // Configurar encabezados CORS para rutas /api/
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Permitir el origen correcto o '*' como fallback
    response.headers.set('Access-Control-Allow-Origin', isAllowedOrigin ? origin : '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Gestionar solicitudes preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
  }
  
  // Procesar Auth0 solo para rutas relevantes
  if (request.nextUrl.pathname.startsWith('/api/users/roles') || 
      request.nextUrl.pathname.startsWith('/api/auth')) {
    try {
      // Intentar obtener la sesión
      const session = await getSession(request, response);
      
      // Si hay sesión y usuario, extraer y procesar la información
      if (session?.user) {
        // Procesar roles si están disponibles en el token
        // Este paso es automático en App Router con Edge Runtime
        console.log('Middleware - sesión disponible:', {
          user: session.user.email,
          hasRoles: !!session.user[AUTH0_NAMESPACE],
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Middleware - Error procesando Auth0:', {
        message: error.message,
        type: error.constructor.name,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  return response;
}

// Configurar las rutas que deben pasar por el middleware
export const config = {
  matcher: [
    '/api/:path*', 
    '/api/auth/:path*',
  ],
};

export const runtime = 'edge'; 