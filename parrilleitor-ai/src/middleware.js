import { NextResponse } from 'next/server';

// Lista de orígenes permitidos
const allowedOrigins = [
  'https://parrilleitorai.vercel.app',
  'http://localhost:3000',
  'https://dev-zwbfqql3rcbh67rv.us.auth0.com',
];

// Middleware para gestionar CORS y otras funcionalidades
export function middleware(request) {
  // Obtener el origen de la solicitud
  const origin = request.headers.get('origin');
  const requestHeaders = new Headers(request.headers);
  
  // Verificar si el origen es permitido
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  
  // Crear una respuesta con cabeceras modificadas
  const response = NextResponse.next({
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
  
  return response;
}

// Configurar las rutas que deben pasar por el middleware
export const config = {
  matcher: [
    '/api/:path*', 
    '/api/auth/:path*',
  ],
}; 